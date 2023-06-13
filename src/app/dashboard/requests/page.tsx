import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import React from 'react'
import FriendRequests from '../../../components/FriendRequests'
import { fetchRedis } from '../../../helpers/redis'
import { authOptions } from '../../../lib/auth'


const page = async ({}) => {
  const session = await getServerSession(authOptions)
  if(!session) notFound()

  // пользователь пославший запрос в друзья
  const incomingIds = (await fetchRedis('smembers', `user:${session.user.id}:incoming_friends_request`) as string[])

  const incomingFriendRequests = await Promise.all(
    incomingIds.map(async (senderId) => {
      const sender = (await fetchRedis('get', `user:${senderId}`)) as string
      const senderParse = JSON.parse(sender) as User
      return {
        senderId,
        senderEmail: senderParse.email,
      }
    })
  )
  return <main className='pt-8'>
          <h1 className="font-bold text-5xl mb-8">Добавить друга</h1>
          <div className="flex flex-col gap-4">
            <FriendRequests incomingFriendRequests={incomingFriendRequests} sessionId={session.user.id}/>
          </div>
        </main>
}

export default page