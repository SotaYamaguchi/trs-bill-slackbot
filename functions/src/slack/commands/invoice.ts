import { App } from "@slack/bolt";

import { firestore } from "../../lib/firestore";
import { Course, Work, User } from '../../type/common';
import { formatMD, formatYYYYM } from "../../utils/dateUtils";

const VIEW_ID = "dialog_invoice";

type WorkInfo = {
  course: string,
  date: string[],
  place: string,
  price: number
}

const calcPrice = (price: number, count: number) => price * count

const createMessageBlock = (
  username: string,
  userIcon: string,
  works: WorkInfo[],
  date: string
) => {
  const totalCount = works.map(x => x.date.length).reduce((prev, current, i, arr) => prev + current)
  const totalPrice = works.map(x => calcPrice(x.price, x.date.length)).reduce((prev, current, i, arr) => prev + current)
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
        text: `*${formatYYYYM(date)}分の請求*\n\n--------------\n\n${works.map(x => `${x.course} (${x.place}) ${x.date.join(',')}\n--- 小計 ${x.date.length}回 ${calcPrice(x.price, x.date.length).toLocaleString()}円`).join('\n\n')}\n\n--------------\n\n合計 ${totalCount}回 ${totalPrice.toLocaleString()}円`
      },
      accessory: {
        type: "image",
        image_url: userIcon,
        alt_text: "user thumbnail"
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

const findWorks = async (userId: string, date: string): Promise<Work[]> => {
  let works = [] as Work[];
  try {
    const snapShot = await firestore
      .collection("work")
      .where("user", "==", userId)
      .get();
    snapShot.forEach(d => works = [...works, d.data() as Work]);
  } catch (e) {
    console.error("find works post error", e);
  }
  // 選択した月（YYYY/MMの形式）
  const selectMonth = date.split('-').slice(0, 2).join('-');
  return works.filter(x => x.date.includes(selectMonth));
};

export const useInvoiceCommand = (app: App) => {
  app.command("/trs_invoice", async ({ ack, body, context, command }) => {
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
            text: "発行月を選択"
          },
          blocks: [
            {
              type: "input",
              block_id: "date_block",
              label: {
                type: "plain_text",
                text: "選択した日付が含まれる月の請求書を発行します"
              },
              element: {
                type: "datepicker",
                action_id: "date_input",
              }
            }
          ],
          private_metadata: command.channel_id,
          submit: {
            type: "plain_text",
            text: "発行"
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


    try {
      const userId = body.user.id;

      const courses = await findCourses();
      const works = await findWorks(userId, date);

      const courseNames = Array.from(new Set(works.map(x => x.course)))

      const fixedWorks = courseNames.map(x => ({
        course: x,
        date: works.filter(y => y.course === x)
          .sort((a, b) => a.date < b.date ? 1 : -1)
          .map(y => formatMD(y.date)),
        place: courses.find(y => y.course === x)?.place || '',
        price: courses.find(y => y.course === x)?.price || 0
      }));

      // get user info
      const { user } = await app.client.users.info({
        token: context.botToken,
        user: userId
      });

      // post chanel
      await app.client.chat.postMessage({
        token: context.botToken,
        channel: channelId,
        text: "",
        blocks: createMessageBlock(
          (user as User).real_name,
          (user as User).profile.image_192,
          fixedWorks,
          date
        )
      });
    } catch (error) {
      console.error("post message error", error);
    }
  });
};