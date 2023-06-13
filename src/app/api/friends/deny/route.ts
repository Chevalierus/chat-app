import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "../../../../lib/auth"
import { db } from "../../../../lib/db"

export async function POST(req: Request) {
    try {
      const body = await req.json()

      const session = await getServerSession(authOptions)

      if(!session) {
        return new Response("Авторизируйтесь", {status: 401})
      }

      const {id: idToAdd} = z.object({id: z.string() }).parse(body)

      await db.srem(`user:${session.user.id}:incoming_friends_request`, idToAdd)

      return new Response("OK", {status: 200})
    } catch (error) {
      if(error instanceof z.ZodError) {
        return new Response ('Неверный запрос 422', {status: 422})
      }

      return new Response ('Неверный запрос 400',{status: 400})
    }
}