import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {KnowledgeBaseDataSourceStack, BedrockKnowledgeBaseStack, BedrockAgentsStack,KnowledgeBaseDataStoreStack, FoundationStack} from './nested-stacks';


export class BedrockEmailSupportAgentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const foundationStack = new FoundationStack(this,"FoundationResources");
    const dataSourceStack = new KnowledgeBaseDataSourceStack(this,"KnowledgeBaseDataSource");
    //const testResource = new CdkCustomResourceStack(this,"testResource");
    const dataStoreStack = new KnowledgeBaseDataStoreStack(this,"KnowledgeBaseDataStore",{nodeJsLayer:foundationStack.resources.nodeJsLambdaLayer});
    
    const knowledgeBaseStack = new BedrockKnowledgeBaseStack(this,"BedrockKnowledgeBase",{
      bucket:dataSourceStack.resources.bucket, 
      bucketKmsKey:dataSourceStack.resources.kmsKey,
    ossCollection:dataStoreStack.resources.ossCollection});

    knowledgeBaseStack.addDependency(dataSourceStack);
    //const bedrockAgents = new BedrockAgentsStack(this,"BedrockAgentsStack", {knowledgeBase:knowledgeBaseStack.resources.knowledgeBase});
  }
}
