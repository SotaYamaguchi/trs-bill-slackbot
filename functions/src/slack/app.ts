import * as functions from "firebase-functions";
import { App, ExpressReceiver } from "@slack/bolt";

import { usePingCommand } from "../slack/commands/ping";
import { useTimeCardCommand } from "../slack/commands/timeCard";
import { useCreateCourseCommand } from "../slack/commands/createCourse";
import { useListCourseCommand } from "../slack/commands/listCourse";

const config = functions.config();

export const expressReceiver = new ExpressReceiver({
  signingSecret: config.slack.secret,
  endpoints: "/events",
  processBeforeResponse: true
});

const app = new App({
  receiver: expressReceiver,
  token: config.slack.token
});

usePingCommand(app);
useTimeCardCommand(app);
useCreateCourseCommand(app);
useListCourseCommand(app);
