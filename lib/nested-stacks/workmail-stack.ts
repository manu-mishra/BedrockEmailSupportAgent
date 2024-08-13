import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { WorkmailCreateOrgConstruct, WorkmailEmailHandlerConstruct } from '../constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';


export class WorkMailStack extends cdk.NestedStack {
    constructor(scope: Construct, id: string, props: cdk.StackProps & { 
        lambdaLayer: lambda.LayerVersion; 
        agent: cdk.aws_bedrock.CfnAgent;
        agentAlias: cdk.aws_bedrock.CfnAgentAlias;
    }) 
    {
        super(scope, id, props);
        const workmailOrg = new WorkmailCreateOrgConstruct(this, 'WorkmailOrg', { nodeJsLayer: props.lambdaLayer });
        const emailHandlerLambda = new WorkmailEmailHandlerConstruct(this, 'EmailHandler', { nodeJsLayer: props.lambdaLayer, agent:props.agent, agentAlias: props.agentAlias });
    }
}