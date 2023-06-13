import { getServerSession } from "next-auth"
import { fetchRedis } from "../../../../helpers/redis"
import { authOptions } from "../../../../lib/auth"
import { db } from "../../../../lib/db"
import { addFriendValidator } from "../../../../lib/validations/add-friend"
import { z } from 'zod'
import { pusherServer } from "../../../../lib/pusher"
import { toPusherKey } from "../../../../lib/utils"

export async function POST(req: Request) {
  try{
    const body = await req.json()

    const {email: emailToAdd} = addFriendValidator.parse(body.email)

    // const RESTResponse = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/user:email:${emailToAdd}`, {
    //   headers: {
    //     Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`
    //   },
    //   cache: "no-store",
    // })

    // const data = await RESTResponse.json() as {result: string | null}


    const idToAdd = (await fetchRedis('get', `user:email:${emailToAdd}`)) as string

    if(!idToAdd) {
      return new Response('Такого аккаунта не существует', {status: 400})
    }

    const session = await getServerSession(authOptions)

    if(!session) {
      return new Response('Авторизируйтесь', {status: 401})
    }

    if(idToAdd === session?.user.id) {
      return new Response("Нельзя добавить самого себя", {status: 400})
    }

    // если пользователь уже добавлен
    const alreadyAdded = await fetchRedis('sismember', `user:${idToAdd}:incoming_friend_requests`, session.user.id) as 0 | 1

    if(alreadyAdded) {
      return new Response('Вы уже отправили запрос', {status: 400})
    }

    // если пользователь уже друг
    const alreadyFriends = await fetchRedis('sismember', `user:${session.user.id}:friends`, idToAdd) as 0 | 1

    if(alreadyFriends) {
      return new Response('Такой друг уже есть', {status: 400})
    }

    pusherServer.trigger(
      toPusherKey(`user:${idToAdd}:incoming_friend_requests`),
      'incoming_friend_requests',
      {
        senderId: session.user.id,
        senderEmail: session.user.email
      }
    )

    await db.sadd(`user:${idToAdd}:incoming_friends_request`, session.user.id)

    return new Response('OK', {status: 200})
  } catch (error) {
    if(error instanceof z.ZodError) {
      return new Response ('Неверный запрос 422', {status: 422})
    }

    return new Response ('Неверный запрос 400', {status: 400})
  } 
}