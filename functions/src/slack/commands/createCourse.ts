import { App } from "@slack/bolt";

import { localeNow } from "../../lib/localdate";
import { firestore } from "../../lib/firestore";
import * as validations from "../../utils/validationUtils";

const VIEW_ID = "dialog_2";

type User = {
  real_name: string;
  profile: {
    image_192: string;
  };
};

const createMessageBlock = (
  username: string,
  course: string,
  place: string,
  price: string
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
        text: `下記のコースが登録されました\n\n*コース名* ${course}\n\n*実施場所* ${place}\n\n*金額* ${price}`
      },
    },
    {
      type: "divider"
    }
  ];
};

export const useCreateCourseCommand = (app: App) => {
  app.command("/trs_create_course", async ({ ack, body, context, command }) => {
    await ack();
    try {
      await app.client.views.open({
        token: context.botToken,
        trigger_id: body.trigger_id,
        view: {
          type: "modal",
          callback_id: VIEW_ID,
          title: {
            type: "plain_text",
            text: "コース情報登録"
          },
          blocks: [
            {
              type: "input",
              block_id: "course_block",
              label: {
                type: "plain_text",
                text: "コース名"
              },
              element: {
                type: "plain_text_input",
                action_id: "course_input",
                placeholder: {
                  "type": "plain_text",
                  "text": "基礎"
                }
              }
            },
            {
              type: "input",
              block_id: "place_block",
              label: {
                type: "plain_text",
                text: "実施場所"
              },
              element: {
                type: "plain_text_input",
                action_id: "place_input",
                placeholder: {
                  "type": "plain_text",
                  "text": "笠原教室"
                }
              }
            },
            {
              type: "input",
              block_id: "price_block",
              label: {
                type: "plain_text",
                text: "金額"
              },
              element: {
                type: "plain_text_input",
                action_id: "price_input",
                placeholder: {
                  "type": "plain_text",
                  "text": "3,000"
                }
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
      console.error("モーダルで発生したエラー", error);
    }
  });

  app.view(VIEW_ID, async ({ ack, view, context, body }) => {
    await ack();

    const values = view.state.values;
    const channelId = view.private_metadata;
    const course = values.course_block.course_input.value;
    const place = values.place_block.place_input.value;
    const price = validations.isNumeric(values.price_block.price_input.value) ? parseInt(values.price_block.price_input.value, 10) : 0;

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
          course,
          place,
          price.toLocaleString()
        )
      });
      // save data
      await firestore.collection("course").add({
        course,
        place,
        price,
        createdAt: localeNow().format("YYYY/MM/DD H:mm"),
        deletedAt: ''
      });
    } catch (error) {
      console.error("post message error", error);
    }
  });
};