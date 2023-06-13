"use client"

import { Session } from 'inspector'
import { usePathname, useRouter } from 'next/navigation'
import { FC, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { pusherClient } from '../lib/pusher'
import { chatHrefConstructor, toPusherKey } from '../lib/utils'
import UnseenChatToast from './UnseenChatToast'

interface SidebarChatListProps {
  friends: User[]
  sessionId: string
}

interface ExtendedMessage extends Message {
  senderImg: string
  senderName: string
}

const SidebarChatList: FC<SidebarChatListProps> = ({friends, sessionId}) => {
  const router = useRouter()
  const pathName = usePathname()
  const [unseenMessages, setUnseenMessages] = useState<Message[]>([])
  const [activeChats, setActiveChats] = useState<User[]>(friends)

  useEffect(() => {
    pusherClient.subscribe(toPusherKey(`user:${sessionId}:chat`)),
    pusherClient.subscribe(toPusherKey(`user:${sessionId}:friends`))

    const newFriendHandler = (newFriend: User) => {
      setActiveChats((el) => [...el, newFriend])
    }

    const chatHandler = (message: ExtendedMessage) => {
      const shouldNotify = pathName !== `/dashboard/chat/${chatHrefConstructor(sessionId, message.senderId)}`

      if(!shouldNotify) return

      toast.custom((t) => (
        <UnseenChatToast t={t} sessionId={sessionId} senderId={message.senderId} senderImg={message.senderImg} senderMessage={message.text} senderName={message.senderName}/>
      ))

      setUnseenMessages((prev) => [...prev, message])
    }

    pusherClient.bind(`new_message`, chatHandler) 
    pusherClient.bind(`new_friend`, newFriendHandler)

    return () => {
      pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:chat`)),
      pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:friends`))
    }
  }, [pathName, sessionId, router])

  useEffect(() => {
    if(pathName?.includes('chat')) {
      setUnseenMessages((prev) => {
        return prev.filter((msg) => !pathName.includes(msg.senderId))
      })
    }
  }, [pathName])

  return <ul role="list" className="max-h-[25rem] overflow-y-auto -mx-2 space-y-1">
    {activeChats.sort().map((el) => {
      const unseenMessagesCount = unseenMessages.filter((unseenMsg) => {
        return unseenMsg.senderId === el.id
      }).length
      return <li key={el.id} className="text-gray-700 hover:text-indigo-600 hover:bg-gray-50 group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold">
        <a href={`/dashboard/chat/${chatHrefConstructor(sessionId, el.id)}`}>
          {el.name}
          {unseenMessagesCount > 0 ? <div className="bg-indigo-600 font-medium text-xs text-white-400 h-4 w-4 rounded-full flex justify-center items-center">
            {unseenMessagesCount}
          </div> : null}
        </a>
      </li>
    })}
  </ul>
}

export default SidebarChatList