import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BedrockAgentConstruct, BedrockKbConstruct, WorkMailConstruct } from './constructs';
import { NodejsLambdaLayerConstruct } from './constructs';


export class BedrockEmailSupportAgentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaLayer = new NodejsLambdaLayerConstruct(this, 'NodeJsLambdaLayer').lambdaLayer;
    const kbStack = new BedrockKbConstruct(this, 'BedrockKbConstruct', { lambdaLayer: lambdaLayer });
    
    //Create Agent Flow.
    const agentStack = new BedrockAgentConstruct(this, 'BedrockAgentConstruct', { bedrockKb: kbStack.bedrockKnowledgeBase });
    agentStack.node.addDependency(kbStack);
    
    //Create WorkMail based flow
    const workmailStack = new WorkMailConstruct(this, 'WorkmailIntegrationConstruct', {lambdaLayer:lambdaLayer, agent:agentStack.agent, agentAlias: agentStack.agentAlias});
    workmailStack.node.addDependency(agentStack)
  }
}
