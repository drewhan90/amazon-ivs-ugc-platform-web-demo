import { v4 as uuidv4 } from 'uuid';
import {
  CreateParticipantTokenCommand,
  CreateParticipantTokenCommandInput,
  CreateStageCommand,
  CreateStageCommandInput,
  DeleteStageCommand,
  GetStageCommand,
  IVSRealTimeClient,
  ListParticipantsCommand,
  ListParticipantsCommandInput,
  ParticipantSummary
} from '@aws-sdk/client-ivs-realtime';
import {
  ChannelAssets,
  getChannelAssetUrls,
  getChannelId
} from '../shared/helpers';
import {
  ALLOWED_CHANNEL_ASSET_TYPES,
  CUSTOM_AVATAR_NAME,
  STAGE_TOKEN_DURATION
} from '../shared/constants';
import { getUser } from '../channel/helpers';
import { ParticipantTokenCapability } from '@aws-sdk/client-ivs-realtime';
import { unmarshall } from '@aws-sdk/util-dynamodb';

export const USER_STAGE_ID_SEPARATOR = ':stage/';

interface HandleCreateStageParams {
  userSub?: string;
  participantType: string;
  isHostInStage?: boolean;
}

const CHANNEL_ASSET_AVATAR_DELIMITER = 'https://';

const STAGE_CONNECTION_STATES = {
  CONNECTED: 'CONNECTED'
};

export enum PARTICIPANT_TYPES {
  HOST = 'host',
  SPECTATOR = 'spectator',
  INVITED = 'invited',
  REQUESTED = 'requested'
}

export const PARTICIPANT_USER_TYPES = {
  HOST: 'host',
  SPECTATOR: 'spectator',
  INVITED: 'invited',
  REQUESTED: 'requested'
};

const PARTICIPANT_CONNECTION_STATES = {
  CONNECTED: 'CONNECTED'
};

const shouldFetchUserData = [
  PARTICIPANT_USER_TYPES.HOST,
  PARTICIPANT_USER_TYPES.INVITED
];

export type ParticipantType =
  | PARTICIPANT_TYPES.HOST
  | PARTICIPANT_TYPES.SPECTATOR
  | PARTICIPANT_TYPES.INVITED
  | PARTICIPANT_TYPES.REQUESTED;

const client = new IVSRealTimeClient({});

const extractStageIdfromStageArn = (userStageArn: string | undefined) => {
  if (!userStageArn) return '';
  return userStageArn.split(USER_STAGE_ID_SEPARATOR)[1];
};

export const handleCreateStage = async (input: CreateStageCommandInput) => {
  const command = new CreateStageCommand(input);
  const { participantTokens, stage } = await client.send(command);

  const token = participantTokens?.[0].token;
  const stageId = extractStageIdfromStageArn(stage?.arn);

  return {
    token,
    stageId
  };
};

export const handleDeleteStage = async (stageId: string) => {
  const stageArn = buildStageArn(stageId);

  const deleteStageCommand = new DeleteStageCommand({ arn: stageArn });

  await client.send(deleteStageCommand);
};

export const handleCreateParticipantToken = async (
  input: CreateParticipantTokenCommandInput
) => {
  try {
    const command = new CreateParticipantTokenCommand(input);
    const { participantToken } = await client.send(command);

    return participantToken?.token;
  } catch (err) {
    throw new Error('Failed to create token');
  }
};

export const buildStageArn = (stageId: string) =>
  `arn:aws:ivs:${process.env.REGION}:${process.env.ACCOUNT_ID}${USER_STAGE_ID_SEPARATOR}${stageId}`;

export const getStage = async (stageId: string) => {
  try {
    const stageArn = buildStageArn(stageId);

    const getStageCommand = new GetStageCommand({ arn: stageArn });
    const stage = await client.send(getStageCommand);

    return stage;
  } catch (err) {
    throw new Error('Something went wrong');
  }
};

export const getChannelAssetAvatarURL = (
  channelAssets: ChannelAssets,
  avatar: string
) => {
  const channelAssetsAvatarUrl: string | undefined =
    getChannelAssetUrls(channelAssets)?.[ALLOWED_CHANNEL_ASSET_TYPES[0]];

  return avatar === CUSTOM_AVATAR_NAME && !!channelAssetsAvatarUrl
    ? channelAssetsAvatarUrl.split(CHANNEL_ASSET_AVATAR_DELIMITER)[1]
    : '';
};

export const handleCreateStageParams = async ({
  userSub,
  participantType,
  isHostInStage = false
}: HandleCreateStageParams) => {
  const shouldCreateHostUserType =
    participantType === PARTICIPANT_USER_TYPES.HOST && !isHostInStage;

  let username,
    profileColor,
    avatar,
    channelAssets,
    channelArn,
    channelAssetsAvatarUrlPath = '';

  if (userSub && shouldFetchUserData.includes(participantType)) {
    const { Item: UserItem = {} } = await getUser(userSub);
    ({
      avatar,
      color: profileColor,
      channelAssets,
      username,
      channelArn
    } = unmarshall(UserItem));
    channelAssetsAvatarUrlPath = getChannelAssetAvatarURL(
      channelAssets,
      avatar
    );
  }

  const capabilities =
    participantType === PARTICIPANT_USER_TYPES.SPECTATOR
      ? [ParticipantTokenCapability.SUBSCRIBE]
      : [
          ParticipantTokenCapability.PUBLISH,
          ParticipantTokenCapability.SUBSCRIBE
        ];

  const userId = shouldCreateHostUserType
    ? generateHostUserId(channelArn)
    : uuidv4();

  let userType = shouldCreateHostUserType
    ? PARTICIPANT_USER_TYPES.HOST
    : PARTICIPANT_USER_TYPES.INVITED;
  if (participantType === PARTICIPANT_USER_TYPES.SPECTATOR) {
    userType = PARTICIPANT_USER_TYPES.SPECTATOR;
  }

  return {
    username,
    profileColor,
    avatar,
    channelAssetsAvatarUrlPath,
    duration: STAGE_TOKEN_DURATION,
    userId,
    capabilities,
    userType
  };
};

// participants
const listParticipants = async (input: ListParticipantsCommandInput) => {
  const listParticipantsCommand = new ListParticipantsCommand(input);

  return await client.send(listParticipantsCommand);
};

export const generateHostUserId = (channelArn: string) => {
  const channelId = getChannelId(channelArn);

  return `${PARTICIPANT_USER_TYPES.HOST}:${channelId}`;
};

export const isUserInStage = async (stageId: string, userSub: string) => {
  const { stage } = await getStage(stageId);
  const { Item: UserItem = {} } = await getUser(userSub);
  const { channelArn } = unmarshall(UserItem);
  const hostUserId = generateHostUserId(channelArn);
  const stageArn = buildStageArn(stageId);

  if (!stage?.activeSessionId) return false;

  const { participants } = await listParticipants({
    stageArn,
    sessionId: stage?.activeSessionId,
    filterByUserId: hostUserId
  });

  if (!participants) return false;

  return participants.some(
    ({ state }) => state === PARTICIPANT_CONNECTION_STATES.CONNECTED
  );
};

export const isStageActive = async (stageId: string) => {
  const { stage } = await getStage(stageId);

  return !!stage?.activeSessionId;
};

const getNumberOfParticipantsInStage = (
  participants: ParticipantSummary[] | undefined
) => {
  if (!participants) return 0;

  const participantList = new Set();
  const participantIds = new Map();

  for (const participant of participants) {
    const { participantId } = participant;
    if (!participantIds.has(participantId)) {
      participantIds.set(participantId, true);
      participantList.add(participant);
    }
  }

  return participantList.size;
};

export const shouldAllowParticipantToJoin = async (stageId: string) => {
  const { stage } = await getStage(stageId);
  const stageArn = buildStageArn(stageId);

  if (stage?.activeSessionId) {
    throw new Error('Stage is not active');
  }

  const { participants } = await listParticipants({
    stageArn,
    sessionId: stage?.activeSessionId,
    filterByPublished: true
  });

  const isHostInStage = participants?.find(
    (participant) =>
      participant.userId?.includes(PARTICIPANT_USER_TYPES.HOST) &&
      participant.state === STAGE_CONNECTION_STATES.CONNECTED
  );

  if (!isHostInStage) {
    const numberOfParticipantInStage =
      getNumberOfParticipantsInStage(participants);

    // save the last spot for the host
    if (numberOfParticipantInStage >= 11) {
      return false;
    }
  }

  return true;
};

export const validateRequestParams = (...requestParams: string[]) => {
  let misssingParams: string[] = [];

  requestParams.forEach((paramName) => {
    if (
      paramName === 'undefined' ||
      paramName === 'null' ||
      paramName.trim() === ''
    ) {
      misssingParams.push(paramName);
    }
  });

  return (
    misssingParams.length &&
    misssingParams.join(misssingParams.length > 1 ? ', ' : '')
  );
};
