# Doclerk Text Summarizer API

## Prerequisite

### Serverless framework

Use serverless framework to deploy.  
See [official document](https://serverless.com/), install and setup `sls`.

### IBM Project Debater

Please login to Debater.ibm.com and issue APIKEY and get Python SDK.

## Quick start

### Commons

You make directory `vendor` in project root and deploy Project Debater SDK in `vendor`.

### Run local

This api is serverless api, so you cannot launch api in local. You can only invoke lambda function
directly.

1. `poetry install`
2. `DEBATER_APIKEY="apikey" sls invoke local --function keypoint`

### Deploy in AWS

1. `DEBATER_APIKEY="apikey" sls deploy`

#### Notes

* When you deploy this api, serverless framework create various resources, such as Lambda, Step
  Functions and API Gateway. So you have to be careful of billing.
