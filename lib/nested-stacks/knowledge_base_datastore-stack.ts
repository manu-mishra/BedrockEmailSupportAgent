import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as opensearch from 'aws-cdk-lib/aws-opensearchserverless';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';

interface KnowledgeBaseDataStoreResources {
  ossCollection: opensearch.CfnCollection;
}

interface KnowledgeBaseDataStoreProps extends cdk.NestedStackProps {
  nodeJsLayer: lambda.LayerVersion;
}

export class KnowledgeBaseDataStoreStack extends cdk.NestedStack {
  public readonly resources: KnowledgeBaseDataStoreResources;

  constructor(scope: Construct, id: string, props: KnowledgeBaseDataStoreProps) {
    super(scope, id, props);

    const collectionName = "knowledge-base-collection";
    const indexName = "bedrock-knowledge-base-default-index"; 
    const vectorField = "bedrock-knowledge-base-default-vector";  
    const dimensions = "1024";

    // Create the OpenSearch collection with KMS encryption
    const opensearchCollection = new opensearch.CfnCollection(this, 'KnowledgeBaseCollection', {
      name: collectionName,
      type: "VECTORSEARCH",
      description: 'A serverless OpenSearch collection for the knowledge base',
    });
    
    // Static network policy to allow access only from AWS
    const networkPolicy =  new opensearch.CfnSecurityPolicy(this, "OSSNetworkPolicy", {
      name: "oss-network-policy",
      policy: JSON.stringify([
        {
          Rules: [
            {
              ResourceType: "collection",
              Resource: [`collection/${collectionName}`],
            },
            {
              ResourceType: "dashboard",
              Resource: [`collection/${collectionName}`],
            },
          ],
          AllowFromPublic: true,
        }
      ]),
      type: "network",
    });

    // Encryption policy
    const encryptionPolicy = new opensearch.CfnSecurityPolicy(this, 'OSSEncryptionPolicy', {
      name: 'oss-data-encryption-policy',
      type: 'encryption',
      description: 'Encryption policy for the knowledge base collection',

      policy: JSON.stringify({
        Rules: [
          {
            ResourceType: "collection",
            Resource: [`collection/${collectionName}`]
          }
        ],
        AWSOwnedKey: true
      }),
    });

    
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for custom resource Lambda to manage OpenSearch collection',
    });
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));

    // Lambda function to create the KNN index
    const createKnnIndexLambda = new lambda.Function(this, 'CreateKnnIndexLambda', {
      functionName:'CreateKnnIndexCustomResourceLambda',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../assets/lambda/cr-create-oss-index')),
      layers:[props.nodeJsLayer],
      role:lambdaRole,
      timeout:cdk.Duration.minutes(5),
      environment:{
        ENDPOINT: opensearchCollection.attrCollectionEndpoint,
        INDEX_NAME: indexName,
        VECTOR_FIELD: vectorField,
        DIMENSIONS: dimensions,
        COLLECTION_NAME: collectionName,
      }
    });
    const dataAccessPolicy = new opensearch.CfnAccessPolicy(this, 'OSSAccessPolicy', {
      name: 'oss-data-access-policy',
      policy: JSON.stringify([
        {
          Rules: [
            {
              ResourceType: 'collection',
              Resource: [`collection/${collectionName}`],
              Permission: [
                'aoss:*'
              ],
            },
            {
              ResourceType: 'index',
              Resource: [`index/${collectionName}/*`],
              Permission: [
                'aoss:*'
              ],
            },
          ],
          Principal: [
            lambdaRole.roleArn,
            `arn:aws:iam::${this.account}:root`,
          ],
        },
      ]),
      type: 'data',
      description: 'Data access policy for collection',
    });
    
    // Create the custom resource
    const provider = new cr.Provider(this, 'CustomResourceProvider', {
      onEventHandler: createKnnIndexLambda,
    });

    const knnIndexResource = new cdk.CustomResource(this, 'CustomResource', {
      serviceToken: provider.serviceToken,
    });
    
    const ossCollectionPolicy = new iam.PolicyStatement({
      actions: [
        'aoss:*'
      ],
      resources: [
        `arn:aws:aoss:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:collection/*`,
        `arn:aws:aoss:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:index/*/*`
        ],
    });
     lambdaRole.addToPolicy(ossCollectionPolicy);
    
    // // Ensure the custom resource is created after the collection
    knnIndexResource.node.addDependency(opensearchCollection);
    opensearchCollection.node.addDependency(networkPolicy);
    opensearchCollection.node.addDependency(encryptionPolicy);

    // Store the resources in the public property
    this.resources = {
      ossCollection: opensearchCollection
    };
  }
}
