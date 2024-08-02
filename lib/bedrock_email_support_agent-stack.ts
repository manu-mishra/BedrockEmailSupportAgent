import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { KnowledgeBaseDataSourceStack, BedrockKnowledgeBaseStack, BedrockAgentsStack } from './nested-stacks';


export class BedrockEmailSupportAgentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const dataSourceStack = new KnowledgeBaseDataSourceStack(this,"KnowledgeBaseDataSource");
    const knowledgeBaseStack = new BedrockKnowledgeBaseStack(this,"BedrockKnowledgeBase",{bucket:dataSourceStack.resources.bucket, kmsKey:dataSourceStack.resources.kmsKey});
    const bedrockAgents = new BedrockAgentsStack(this,"BedrockAgentsStack", {knowledgeBase:knowledgeBaseStack.resources.knowledgeBase});
  }
}
