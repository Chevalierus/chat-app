import { nanoid } from "nanoid";
import { getServerSession } from "next-auth";
import { fetchRedis } from "../../../../helpers/redis";
import { authOptions } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { pusherServer } from "../../../../lib/pusher";
import { toPusherKey } from "../../../../lib/utils";
import { messageValidator } from "../../../../lib/validations/message";

export async function POST (req: Request) {
  try {
    const {text, chatId} : {text: string, chatId: string} = await req.json()
    const session = await getServerSession(authOptions)

    if(!session) return new Response ("Авторизируйтесь", {status: 401})

    const [userId1, userId2] = chatId.split('--')

    if(session.user.id !== userId1 && session.user.id !== userId2) {
      return new Response ('Авторизируйтесь', {status: 401})
    }

    const friendId = session.user.id === userId1 ? userId2 : userId1

    const friendList = (await fetchRedis('smembers', `user:${session.user.id}:friends`)) as string[]
    const isFriend = friendList.includes(friendId)

    if(!isFriend) {
      return new Response("Добавьте пользователя в друзья, что бы отправлять сообщения!", {status: 401})
    }

    const rawSender = (await fetchRedis('get', `user:${session.user.id}`)) as string
    const sender = JSON.parse(rawSender) as User
 
    const timeStamp = Date.now()
    //@ts-ignore
    const messageData: Message = {
      id: nanoid(),
      senderId: session.user.id,
      text,
      timeStamp,
    }

    const message = messageValidator.parse(messageData)

    //оповещение о пришедшем сообщении
    pusherServer.trigger(toPusherKey(`chat:${chatId}`),
      'incoming_message',
      message
    )

    pusherServer.trigger(toPusherKey(`user:${friendId}:chat`),
    `new_message`,
    {...message, senderImg: sender.image, senderName: sender.name}
    )

    //все в порядке, можно отправлять сообщение

    await db.zadd(`chat:${chatId}:messages`, {
      score: timeStamp,
      member: JSON.stringify(message)
    })

    return new Response("OK", {status: 200})
  } catch (error)  {
    if(error instanceof Error) {
      return new Response(error.message, {status: 500})
    }

    return new Response ("Неизвестная ошибка", {status: 500})
  }
} 