"use client"

import { format } from 'date-fns'
import { FC, useEffect, useRef, useState } from 'react'
import { cn, toPusherKey } from '../lib/utils'
import Image from 'next/image'
import { pusherClient } from '../lib/pusher'


interface MessagesProps {
  initialMessages: Message[]
  sessionId: string
  sessionImg: string | null | undefined
  chatPartner: User
  chatId: string
}

const Messages: FC<MessagesProps> = ({initialMessages, sessionId, sessionImg, chatPartner, chatId}) => {
  const scrollDownRef = useRef<HTMLDivElement | null>(null)
  const [messages, setMessages] = useState<Message[]>(initialMessages)

  useEffect(() => {
    pusherClient.subscribe(toPusherKey(`chat:${chatId}`))
    const messageHandler = (message: Message) => {
      setMessages((prev) => [message, ...prev])
    }
    pusherClient.bind('incoming_message', messageHandler)

    return () => {
      pusherClient.unsubscribe(toPusherKey(`chat:${chatId}`))
      pusherClient.unbind('incoming_message', messageHandler)
    }
  }, [chatId])

  const formatTimestamp = (timeStamp: number) => {
    return format(timeStamp, 'HH:MM ')
  }

  return <div id="messages" className="flex h-full flex-1 flex-col-reverse gap-4 p-3 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch">
    <div ref={scrollDownRef}/>

    {messages.map((el, i) => {
      const isCurrentUser = el.senderId === sessionId

      const hasNextMessageFromSameUser = messages[i - 1]?.senderId === messages[i].senderId

      return (
        <div key={`${el.id}-${el.timeStamp}`} className='chat-message'>
          <div className={cn('flex items-end', {'justufy-end': isCurrentUser})}>
            <div className={cn('flex flex-col space-y-2 text-base max-w-xs mx-2', {
              'order-1 items-end': isCurrentUser,
              'order-2 items-start': !isCurrentUser
              })}>
              <span className={cn('px-4 py-2 rounded-ld inline-block', {
                'bg-indigo-600 text-white': isCurrentUser,
                'bg-gray-200 text-gray-900': !isCurrentUser,
                'rounded-br-one': !hasNextMessageFromSameUser && isCurrentUser,
                'rounded-bl-none': !hasNextMessageFromSameUser && !isCurrentUser
              })}>
                {el.text}{''}
                <span className="ml-2 text-xs text-gray-400">
                  {formatTimestamp(el.timeStamp)}
                </span>
              </span>
            </div>

            <div className={cn('relative w-6 h-6', {
              'order-2': isCurrentUser,
              'order-1': !isCurrentUser,
              'invisible': hasNextMessageFromSameUser
            })}>
              <Image referrerPolicy="no-referrer" className="rounded-full" fill src={isCurrentUser ? (sessionImg as string) : chatPartner.image} alt="Картинка профиля"/>
            </div>
          </div>
        </div>
      )
    })}
  </div>
}

export default Messages