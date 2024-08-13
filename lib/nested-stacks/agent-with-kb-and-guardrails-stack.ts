import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { BedrockAgentBlueprintsConstruct, AgentDefinitionBuilder, AgentActionGroup, AgentKnowledgeBase, BedrockGuardrailsBuilder, FilterType, ManagedWordsTypes, PIIAction, PIIType, KnowledgeBaseStorageConfigurationTypes } from '@aws/agents-for-amazon-bedrock-blueprints';
import { join } from "path";
import * as iam from 'aws-cdk-lib/aws-iam';
import { aws_bedrock as bedrock } from 'aws-cdk-lib';
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { readdirSync, readFileSync } from 'fs';
import { RestaurantAssistDatabaseConstruct } from '../constructs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3_deployment from 'aws-cdk-lib/aws-s3-deployment';

export interface AgentWithKbAndGuardrailsStackResources {
    guardRail: cdk.aws_bedrock.CfnGuardrail;
    agent: cdk.aws_bedrock.CfnAgent;
    agentServiceRole: cdk.aws_iam.Role;
    knowledgeBase: cdk.aws_bedrock.CfnKnowledgeBase;
}

export class AgentWithKbAndGuardrailsStack extends cdk.NestedStack {
    public resources: AgentWithKbAndGuardrailsStackResources;
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);


        const managedPolicies = [
            ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess')
        ];

        // Define the agent's properties
        const agentDef = new AgentDefinitionBuilder(this, 'KBAgent', {})
            .withAgentName('restaurant-assistant-agent-with-kb-and-guardrails')
            .withInstruction(
                'You are a restaurant table booking agent, helping clients retrieve information from their booking, ' +
                'create a new booking or delete an existing booking via email'
            )
            .withFoundationModel('anthropic.claude-3-sonnet-20240229-v1:0')
            .withUserInput()
            .build();

        // Define the function schema for retrieving booking details
        const getBookingDetailsFunction = {
            'name': 'get_booking_details',
            'description': 'Retrieve details of a restaurant booking',
            'parameters': {
                'booking_id': {
                    'description': 'The ID of the booking to retrieve',
                    'required': true,
                    'type': 'string'
                }
            }
        };

        // Define the function schema for creating a new booking
        const createBookingFunction = {
            'name': 'create_booking',
            'description': 'Create a new restaurant booking',
            'parameters': {
                'date': {
                    'description': 'The date of the booking',
                    'required': true,
                    'type': 'string'
                },
                'name': {
                    'description': 'Name to idenfity your reservation',
                    'required': true,
                    'type': 'string'
                },
                'hour': {
                    'description': 'The hour of the booking',
                    'required': true,
                    'type': 'string'
                },
                'num_guests': {
                    'description': 'The number of guests for the booking',
                    'required': true,
                    'type': 'integer'
                }
            }
        };

        // Define the function schema for deleting a booking
        const deleteBookingFunction = {
            'name': 'delete_booking',
            'description': 'Delete an existing restaurant booking',
            'parameters': {
                'booking_id': {
                    'description': 'The ID of the booking to delete',
                    'required': true,
                    'type': 'string'
                }
            }
        };


        // Create Agent Action Group
        const tableBookingAction = new AgentActionGroup(this, 'TableBookingsActionGroup', {
            actionGroupName: 'TableBookingsActionGroup',
            description: 'Actions for getting table booking information, create a new booking or delete an existing booking',
            actionGroupExecutor: {
                lambdaDefinition: {
                    lambdaCode: readFileSync(join(__dirname, '..', '..', 'lambda', 'table-booking-service', 'ag-table-booking-service.ts')),
                    lambdaHandler: 'handler',
                    lambdaRuntime: Runtime.NODEJS_20_X,
                    timeoutInMinutes: 4,
                    managedPolicies: managedPolicies,
                }

            },
            schemaDefinition: {
                functionSchema: {
                    functions: [getBookingDetailsFunction, createBookingFunction, deleteBookingFunction]
                }
            },
        });

        // Define the guardrail configuration
        const guardrail = new BedrockGuardrailsBuilder(this, "AgentGuardrail", {
            name: 'restaurant-assistant-guardrail',
            generateKmsKey: true,
        })
            .withFiltersConfig(FilterType.INSULTS)
            .withManagedWordsConfig(ManagedWordsTypes.PROFANITY)
            .withWordsConfig(['competitor', 'confidential', 'proprietary'])
            .withPIIConfig(PIIAction.ANONYMIZE, PIIType.US_SOCIAL_SECURITY_NUMBER)
            .withTopicConfig("Avoid Religion", "Anything related to religion or religious topics", ['religion', 'faith', 'belief'])
            .build();

        // Define the directory containing asset files
        const assetDir = join(__dirname, '..', '..', 'assets', 'kb_documents');

        // Read all files in the directory and convert them to buffers
        const assetFiles = readdirSync(assetDir).map(fileName => {
            return readFileSync(join(assetDir, fileName));
        });
      
        // Create the knowledge base
        const knowledgeBase = new AgentKnowledgeBase(this, 'BedrockDocs', {
            kbName: 'booking-agent-kb',
            agentInstruction: 'Access the knowledge base when customers ask about the plates in the menu.',
            assetFiles: assetFiles
        });

        const dbConstruct = new RestaurantAssistDatabaseConstruct(this, 'RestaurantAssistDatabaseStack');
        // Create the Bedrock Agent Blueprint
        const agentConstruct = new BedrockAgentBlueprintsConstruct(this, 'AgenticRAGStack', {
            agentDefinition: agentDef,
            actionGroups: [tableBookingAction],
            guardrail: guardrail,
            knowledgeBases: [knowledgeBase]
        });
        agentConstruct.agentServiceRole.node.addDependency(knowledgeBase.knowledgeBase);
        agentConstruct.agent.node.addDependency(knowledgeBase.knowledgeBase);
        this.resources = {
            guardRail: guardrail,
            agent: agentConstruct.agent,
            agentServiceRole: agentConstruct.agentServiceRole,
            knowledgeBase: knowledgeBase.knowledgeBase
        }
    }
}
