import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { KbBedrockKbConstruct, KbOssConstruct, KbS3Construct } from '../constructs'


export class BedrockKbStack extends cdk.NestedStack {
public bedrockKnowledgeBase: cdk.aws_bedrock.CfnKnowledgeBase;
    constructor(scope: Construct, id: string, props: cdk.StackProps & {lambdaLayer:lambda.LayerVersion}) {
        super(scope, id, props);

        const nodejsLambdaLayer = props?.lambdaLayer;
        
        const s3DataSource = new KbS3Construct(scope, "KbBucketSource");
        const ossCollection = new KbOssConstruct(scope, "KbOssCollection", { nodeJsLayer: nodejsLambdaLayer });
        const bedrockKb = new KbBedrockKbConstruct(scope, "BedrockKb", {
            bucket: s3DataSource.kbSourceBucket,
            bucketKmsKey: s3DataSource.kbSourceBucketKmsKey,
            ossCollection: ossCollection.ossCollection,
        });
        bedrockKb.node.addDependency(ossCollection);
        bedrockKb.node.addDependency(s3DataSource);
        this.bedrockKnowledgeBase = bedrockKb.bedrockKnowledgeBase;
    }
}