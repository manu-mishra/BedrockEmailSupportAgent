
import { handler as orgHandler } from './org-creation.mjs';
import { handler as datasourceSyncHandler } from './datasource-sync.mjs';
import dotenv from 'dotenv';

dotenv.config();

// Mock event for creating an organization
const createEvent = {
    RequestType: 'Create',
    ResourceProperties: {
    }
};

const deleteEvent = {
    RequestType: 'Delete',
    ResourceProperties: {
    }
};


const context = {};

async function testOrgCreation() {
    try {
        console.log("Testing Organization Creation...");
        const result = await orgHandler(createEvent, context);
        console.log("Handler result:", result);
    } catch (error) {
        console.error("Error during test:", error);
    }
}

async function testDataSourceSync() {
    try {
        console.log("Testing Datasource Sync...");
        const result = await datasourceSyncHandler(createEvent, context);
        console.log("Handler result:", result);
    } catch (error) {
        console.error("Error during test:", error);
    }
}

testOrgCreation();
//testDataSourceSync();
