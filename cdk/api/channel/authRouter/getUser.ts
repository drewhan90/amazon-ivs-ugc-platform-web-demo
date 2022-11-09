import { FastifyReply, FastifyRequest } from 'fastify';
import { unmarshall } from '@aws-sdk/util-dynamodb';

import { getChannelArnParams, getUser } from '../helpers';
import { ResponseBody } from '../../shared/helpers';
import { UNEXPECTED_EXCEPTION } from '../../shared/constants';
import { UserContext } from '../authorizer';

interface GetUserResponseBody extends ResponseBody {
  avatar?: string;
  channelResourceId?: string;
  color?: string;
  ingestEndpoint?: string;
  playbackUrl?: string;
  streamKeyValue?: string;
  username?: string;
}

const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { sub } = request.requestContext.get('user') as UserContext;
  const responseBody: GetUserResponseBody = {};

  try {
    // Get user from channelsTable
    const { Item = {} } = await getUser(sub);
    const {
      avatar,
      channelArn,
      color,
      ingestEndpoint,
      playbackUrl,
      streamKeyValue,
      username
    } = unmarshall(Item);

    if (!channelArn) {
      throw new Error('No IVS resources have been created for this user.');
    }

    if (channelArn) {
      responseBody.channelResourceId =
        getChannelArnParams(channelArn).resourceId;
    }
    responseBody.avatar = avatar;
    responseBody.color = color;
    responseBody.ingestEndpoint = ingestEndpoint;
    responseBody.playbackUrl = playbackUrl;
    responseBody.streamKeyValue = streamKeyValue;
    responseBody.username = username;
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  return reply.send(responseBody);
};

export default handler;