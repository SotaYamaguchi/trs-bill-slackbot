import { App } from "@slack/bolt";

import { firestore } from "../../lib/firestore";
import { Course, User } from '../../type/common';

const VIEW_ID = "dialog_1";

const createMessageBlock = (
  username: string,
  userIcon: string,
  date: string,
  course: string
) => {
  return [
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `posted by *${username}*`
        }
      ]
    },
    {
      type: "divider"
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:calendar: *実施日*\n${date}\n\n\n:books: *コース*\n${course}`
      }
    }
  ];
};

const findCourses = async (): Promise<Course[]> => {
  let courses = [] as Course[];
  try {
    const snapShot = await firestore
      .collection("course")
      // .orderBy("createdAt", "desc")
      .where("deletedAt", "<=", '')
      .get();
    snapShot.forEach(d => courses = [...courses, d.data() as Course]);
  } catch (e) {
    console.error("find courses post error", e);
  }
  return courses;
};

export const useTimeCardCommand = (app: App) => {
  app.command("/trs_time_card", async ({ ack, body, context, command }) => {
    await ack();
    try {
      const courses = await findCourses();

      await app.client.views.open({
        token: context.botToken,
        trigger_id: body.trigger_id,
        view: {
          type: "modal",
          callback_id: VIEW_ID,
          title: {
            type: "plain_text",
            text: "出勤を記録する"
          },
          blocks: [
            {
              type: "input",
              block_id: "date_block",
              label: {
                type: "plain_text",
                text: "実施日"
              },
              element: {
                type: "datepicker",
                action_id: "date_input",
              }
            },
            {
              type: "input",
              block_id: "course_block",
              label: {
                type: "plain_text",
                text: "コース名"
              },
              element: {
                type: "static_select",
                action_id: "course_input",
                placeholder: {
                  type: "plain_text",
                  text: "コースを選択してください"
                },
                options: courses.map(x => ({
                    text: {
                      type: "plain_text",
                      text: x.course
                    },
                    value: x.course
                  }))
              }
            }
          ],
          private_metadata: command.channel_id,
          submit: {
            type: "plain_text",
            text: "投稿"
          }
        }
      });
    } catch (error) {
      console.error(error);
    }
  });

  app.view(VIEW_ID, async ({ ack, view, context, body }) => {
    await ack();
    const values = view.state.values;
    const channelId = view.private_metadata;
    const date = values.date_block.date_input.selected_date;
    const course = values.course_block.course_input.selected_option.value;

    try {
      // get user info
      const { user } = await app.client.users.info({
        token: context.botToken,
        user: body.user.id
      });
      // post chanel
      await app.client.chat.postMessage({
        token: context.botToken,
        channel: channelId,
        text: "",
        blocks: createMessageBlock(
          (user as User).real_name,
          (user as User).profile.image_192,
          date,
          course
        )
      });
      // save data
      await firestore.collection("work").add({
        user: body.user.id,
        user_name: (user as User).real_name,
        date,
        course
      });
    } catch (error) {
      console.error("post message error", error);
    }
  });
};