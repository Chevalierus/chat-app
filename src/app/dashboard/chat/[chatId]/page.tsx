import { getServerSession } from 'next-auth'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import React from 'react'
import ChatInput from '../../../../components/ChatInput'
import Messages from '../../../../components/Messages'
import { fetchRedis } from '../../../../helpers/redis'
import { authOptions } from '../../../../lib/auth'
import { db } from '../../../../lib/db'
import { messageArrayValidator } from '../../../../lib/validations/message'

interface PageProps {
  params: {
    chatId: string
  }
}

async function getChatMessages(chatId: string) {
  try {
    const result: string[] = await fetchRedis('zrange', `chat:${chatId}:messages`, 0, -1)

    const dbMessages = result.map((el) => JSON.parse(el) as Message)
    const reverseMessages = dbMessages.reverse()
    const messages = messageArrayValidator.parse(reverseMessages)
    return messages
  } catch (error) {
    notFound()
  }
}

const page = async ({params}: PageProps) => {

  const {chatId} = params
  const session = await getServerSession(authOptions) 
  if(!session) notFound()

  const {user} = session

  const [userId1, userId2] = chatId.split('--')

  if(user.id !== userId1 && user.id !== userId2) {
    notFound()
  }

  const chatPartnerId = user.id === userId1 ? userId2 : userId1
  const chatPartnerRaw = (await fetchRedis('get', `user:${chatPartnerId}`)) as string
  const chatPartner = JSON.parse(chatPartnerRaw) as User
  const initialMessages = await getChatMessages(chatId)
  
  return <div className="flex-1 justify-between flex flex-col h-full max-h-[calc(100vh-6rem)]">
    <div className="flex sm:items-center justify-between py-3 border-b-2 border-gray-200">
      <div className="relative">
        <div className="relative w-8 sm:w-12 h-8 sm:h-12">
          <Image fill referrerPolicy='no-referrer' src={chatPartner.image} alt={`${chatPartner.name} картинка пользователя`} className='rounded-full'></Image>
        </div>

        <div className="flex flex-col leading-tight">
          <div className="text-xl flex items-center">
            <span className="text-gray-700 mr-3 font-semibold">{chatPartner.name}</span>
          </div>

          <span className="text-sm text-gray-600 ">{chatPartner.email}</span>
        </div>
      </div>
    </div>
    {/* @ts-ignore */}
    <Messages initialMessages={initialMessages} sessionId={session.user.id} chatPartner={chatPartner} sessionImg={session.user.image} chatId={chatId}/>
    <ChatInput chatId={chatId} chatPartner={chatPartner} />
  </div>
}

export default page