import { ChevronRight } from 'lucide-react'
import { getServerSession } from 'next-auth'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import React, { FC } from 'react'
import { getFriendsByUserId } from '../../helpers/get-friends-by-user-id'
import { fetchRedis } from '../../helpers/redis'
import { authOptions } from '../../lib/auth'
import { chatHrefConstructor } from '../../lib/utils'


const page = async ({}) => {
  const session = await getServerSession(authOptions)
  if(!session) notFound()
  const friends = await getFriendsByUserId(session.user.id)
  const friendsLastMessage = await Promise.all(
    friends.map(async (el) =>   {
      const [rawLastMessage] = (await fetchRedis('zrange', `chat:${chatHrefConstructor(session.user.id, el.id)}:messages`, -1, -1)) as string[]
      const lastMessage = JSON.parse(rawLastMessage) as Message
      return {
        ...el,
        lastMessage
      }
    }) 
  )

return (
<div className='container py-12'>
  <h1 className="font-bold text-5xl mb-8"></h1>
  {friendsLastMessage.length === 0 ? (
    <p className='text-sm text-zinc-400'>Нет новых сообщений...</p>
  ) : (
  friendsLastMessage.map((el) => (
    <div key={el.id} className="reltative bg-zinc-50 border border-zinc-200 p-3 rounded-md">
      <div className='absolute right-4 inset-y-0 flex items-center'>
        <ChevronRight className="w-7 h-7 text-zinc-400"/>
      </div>

      <Link href={`dashboard/chat/${chatHrefConstructor(session.user.id, el.id)}`} className="relative sm:flex">
        <div className="mb-4 flex-shrink-0 sm:mb-0 sm:mr-4">
           <div className="relative h-6 w-6">
             <Image referrerPolicy="no-referrer" className="rounded-full" alt={`${el.name} картинка профиля`} src={el.image} fill/>
           </div>
        </div>
        <div>
          <h4 className='text-lg font-semibold'>
            {el.name}  
          </h4>
          <p className="mt-1 max-w-md">
            <span className="text-zinc-400">
              {el.lastMessage.senderId === session.user.id ? `Вы:` : ''}
            </span>
            {el.lastMessage.text}
          </p>
        </div>
      </Link>
    </div>
  ))
  )}
</div>
)
}

export default page