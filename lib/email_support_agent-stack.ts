import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BedrockAgentStack, BedrockKbStack, WorkMailStack } from './nested-stacks';
import { NodejsLambdaLayerConstruct } from './constructs';


export class BedrockEmailSupportAgentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaLayer = new NodejsLambdaLayerConstruct(this, 'NodeJsLambdaLayer').lambdaLayer;
    const kbStack = new BedrockKbStack(this, 'BedrockKbStack', { lambdaLayer: lambdaLayer });
    
    //CReate Agent Flow.
    const agentStack = new BedrockAgentStack(this, 'BedrockAgentStack', { bedrockKb: kbStack.bedrockKnowledgeBase });
    agentStack.addDependency(kbStack);
    
    //Create WorkMail based flow
    const workmailStack = new WorkMailStack(this, 'WorkmailIntegrationStack', {lambdaLayer:lambdaLayer, agent:agentStack.agent, agentAlias: agentStack.agentAlias});
    workmailStack.addDependency(agentStack)
  }
}
