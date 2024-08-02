import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3_deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as kms from 'aws-cdk-lib/aws-kms';

interface KnowledgeBaseDataSourceResources {
  bucket: s3.Bucket;
  kmsKey: kms.Key;
}

export class KnowledgeBaseDataSourceStack extends cdk.NestedStack {
  public readonly resources: KnowledgeBaseDataSourceResources;

  constructor(scope: Construct, id: string, props?: cdk.NestedStackProps) {
    super(scope, id, props);

    // Create a KMS key
    const kmsKey = new kms.Key(this, 'KnowledgeBaseKmsKey', {
      enableKeyRotation: true,
    });

    // Create the S3 bucket with KMS encryption
    const bucket = new s3.Bucket(this, 'KnowledgeBaseBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
    });

    // Deploy sample PDF to the bucket
    new s3_deployment.BucketDeployment(this, 'DeployBedrockUserGuidePDF', {
      sources: [s3_deployment.Source.asset('./assets/kb')],
      destinationBucket: bucket,
      destinationKeyPrefix: 'kb/', 
    });

    // Store the resources in the public property
    this.resources = {
      bucket: bucket,
      kmsKey: kmsKey
    };
  }
}
