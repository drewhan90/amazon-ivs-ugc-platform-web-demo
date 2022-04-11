import {
  ChannelNotBroadcasting,
  CreateStreamKeyCommand,
  DeleteStreamKeyCommand,
  IvsClient,
  StopStreamCommand
} from '@aws-sdk/client-ivs';
import { APIGatewayProxyWithCognitoAuthorizerHandler } from 'aws-lambda';

import {
  createResponse,
  getUser,
  ResponseBody,
  updateUserStreamKey
} from './utils';

const ivsClient = new IvsClient({});

export interface ResetStreamKeyResponseBody extends ResponseBody {
  streamKeyValue?: string;
}

export const handler: APIGatewayProxyWithCognitoAuthorizerHandler = async (
  event
) => {
  const {
    requestContext: { authorizer: authorizerContext }
  } = event;
  const {
    claims: { sub }
  } = authorizerContext;
  const responseBody: ResetStreamKeyResponseBody = {};
  let newStreamKeyArn;
  let newStreamKeyValue;

  try {
    // Get user from userTable
    const { Item = {} } = await getUser(sub);
    const {
      channelArn: { S: channelArn },
      streamKeyArn: { S: streamKeyArn }
    } = Item;

    // First stop the stream if it's running
    const stopStreamCommand = new StopStreamCommand({ channelArn });

    try {
      await ivsClient.send(stopStreamCommand);
    } catch (error) {
      // Error out silently if the channel is not currently live
      if (!(error instanceof ChannelNotBroadcasting)) {
        throw error;
      }
    }

    // Delete the existing key
    const deleteStreamKeyCommand = new DeleteStreamKeyCommand({
      arn: streamKeyArn
    });

    await ivsClient.send(deleteStreamKeyCommand);

    // Create a new key
    const createStreamKeyCommand = new CreateStreamKeyCommand({ channelArn });
    const { streamKey } = await ivsClient.send(createStreamKeyCommand);

    newStreamKeyArn = streamKey?.arn;
    newStreamKeyValue = streamKey?.value;

    if (!newStreamKeyArn || !newStreamKeyValue) {
      throw new Error(
        `Missing values in the IVS response:\nnewStreamKeyArn: ${newStreamKeyArn}\nnewStreamKeyValue: ${newStreamKeyValue}`
      );
    }

    // Update Dynamo user entry
    await updateUserStreamKey(sub, newStreamKeyArn, newStreamKeyValue);

    responseBody.streamKeyValue = newStreamKeyValue;
  } catch (error) {
    console.error(error);

    return createResponse(500);
  }

  return createResponse(200, responseBody);
};