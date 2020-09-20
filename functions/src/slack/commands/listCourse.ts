import { App } from "@slack/bolt";

import { firestore } from "../../lib/firestore";
import { Course } from '../../type/common';

const createMessageBlock = (
  courses: Course[]
) => {
  return [
    {
      type: "divider"
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: courses.map(x => `${x.course} ${x.place} ${x.price.toLocaleString()}円`).join('\n\n')
      },
    },
    {
      type: "divider"
    }
  ];
};

const getCourses = async (): Promise<Course[]> => {
  let courses = [] as Course[];
  try {
    const snapShot = await firestore
      .collection("course")
      // .orderBy("createdAt", "desc")
      .where("deletedAt", "<=", '')
      .get();
    snapShot.forEach(d => courses = [...courses, d.data() as Course]);
  } catch (e) {
    console.error("get previous post error", e);
  }
  return courses;
};

export const useListCourseCommand = (app: App) => {
  app.command("/trs_list_course", async ({ ack, say, body, context, command }) => {
    await ack();
    const channelId = command.channel_id;
    try {
      const courses = await getCourses();

      // post chanel
      await app.client.chat.postMessage({
        token: context.botToken,
        channel: channelId,
        text: "",
        blocks: createMessageBlock(courses)
      });
    } catch (error) {
      console.error("post message error", error);
    }
  });
};