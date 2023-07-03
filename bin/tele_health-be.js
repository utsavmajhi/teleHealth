#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { TeleHealthCommonStack } = require('../lib/th-common-stack')
const { TeleUserManagementStack } = require('../lib/th-user-management-stack')

const app = new cdk.App();

if(!app.node.tryGetContext('deploy-environment')){
    throw 'Error Please provide environment'
}

let config = {}
if(app.node.tryGetContext('deploy-environment') === 'sit'){
    config = app.node.tryGetContext('sit-config')
}else if(app.node.tryGetContext('deploy-environment') === 'uat'){
    config = app.node.tryGetContext('uat-config')
} else if (app.node.tryGetContext('deploy-environment') === 'prod'){
    config = app.node.tryGetContext('prod-config')
}

const rootStack = new TeleHealthCommonStack(app, 'th-common-stack',{
    env: config.env,
    attributes: config.attributes,
    roles: config.roles,
    allowCrossOrigins: config.allowCrossOrigins})

new TeleUserManagementStack(app, 'th-user-management-stack',{
    env: config.env,
    attributes: config.attributes,
    roles: config.roles,
    allowCrossOrigins: config.allowCrossOrigins,
    layers: rootStack.layers,
    userPools: rootStack.userPools
})



