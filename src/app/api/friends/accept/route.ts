import { getServerSession } from "next-auth"
import { string, z } from "zod"
import { fetchRedis } from "../../../../helpers/redis"
import { authOptions } from "../../../../lib/auth"
import { db } from "../../../../lib/db"
import { pusherServer } from "../../../../lib/pusher"
import { toPusherKey } from "../../../../lib/utils"

export async function POST(req: Request) {
    try {
      const body = await req.json()

      const {id: idToAdd} = z.object({id: z.string() }).parse(body)

      const session = await getServerSession(authOptions)

      if(!session) {
        return new Response('Авторизируйтесь', {status: 401})
      }

      //если уже друзья
      const alreadyFriends = await fetchRedis('sismember', `user:${session.user.id}:friends`, idToAdd)

      if(alreadyFriends) {
        return new Response('Выуже друзья', {status: 400})
      }

      const hasFriendRequest = await fetchRedis('sismember', `user:${session.user.id}:incoming_friends_request`, idToAdd)

      if(!hasFriendRequest) {
        return new Response('Вы уже отправили запрос', {status: 400})
      }

      const [userRaw, friendRaw] = (await Promise.all([
        fetchRedis('get', `user:${session.user.id}`),
        fetchRedis('get', `user:${idToAdd}`)
      ])) as [string, string]

      const user = JSON.parse(userRaw) as User
      const friend = JSON.parse(friendRaw) as User

      await Promise.all([
        pusherServer.trigger(toPusherKey(`user:${idToAdd}:friends`), 'new_friend', user),
        pusherServer.trigger(toPusherKey(`user:${session.user.id}:friends`), 'new_friend', friend),
        db.sadd(`user:${session.user.id}:friends`, idToAdd),
        db.sadd(`user:${idToAdd}:friends`, session.user.id),
        db.srem(`user:${session.user.id}:incoming_friends_request`, idToAdd),
      ])

      return new Response('OK', {status: 200})
    } catch (error) {
      if(error instanceof z.ZodError) {
        return new Response ('Неверный запрос 422', {status: 422})
      }

      return new Response ('Неверный запрос 400',{status: 400})
    }
}