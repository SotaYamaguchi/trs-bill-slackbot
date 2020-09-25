# trs-bill-slackbot

勤怠情報管理用のSlackBot

## Features

### command `/ping`

チャンネルに`pont`と投稿します

### command `/trs_time_card`

- モーダルを表示し、勤務記録を登録します
  - 登録完了した情報をチャンネルに投稿します

### command `/trs_invoice`

- モーダルを表示し、選択した月の請求情報をチャンネルに投稿します

### command `/trs_create_course`

- モーダルを表示し、コース情報を登録します
  - 登録完了した情報をチャンネルに投稿します

### command `/trs_list_course`

- 登録されているコース情報をリストにしてチャンネルに投稿します

## RoadMap

- [x] 自分の勤怠情報を管理できる
- [ ] 複数ユーザーに対して1対多でコース情報を登録できるように

## YouTube

こちらの動画でtrs-bill-botを紹介しています[【Firebase + bolt.js】 勤怠管理用slackbotを作ってみた！](https://www.youtube.com/watch?v=caMnNo26LiE)
