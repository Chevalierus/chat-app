"use client"

import axios from 'axios'
import { Check, UserPlus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FC, useEffect, useState } from 'react'
import { pusherClient } from '../lib/pusher'
import { toPusherKey } from '../lib/utils'

interface FriendRequestsProps {
  incomingFriendRequests: IncomingFriendRequest[]
  sessionId: string
}

const FriendRequests: FC<FriendRequestsProps> = ({incomingFriendRequests, sessionId}) => {
  const router = useRouter()
  const [friendRequests, setFriendRequests] = useState<IncomingFriendRequest[]>(
    incomingFriendRequests
  )

  useEffect(() => {
    pusherClient.subscribe(toPusherKey(`user:${sessionId}:incoming_friend_requests`))
    const friendRequestsHandler = ({senderId, senderEmail}: IncomingFriendRequest) => {
      setFriendRequests((prev) => [...prev, {senderId, senderEmail}])
    }
    pusherClient.bind('incoming_friend_requests', friendRequestsHandler)

    return () => {
      pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:incoming_friend_requests`))
      pusherClient.unbind('incoming_friend_requests', friendRequestsHandler)
    }
  }, [sessionId])

  const acceptFriend = async (senderId: string) => {
    await axios.post('/api/friends/accept', {
      id: senderId
    })

    setFriendRequests((perv) => perv.filter((request) => request.senderId !== senderId))
    router.refresh()
  }

  const denyFriend = async (senderId: string) => {
    await axios.post('/api/friends/deny', {
      id: senderId
    })

    setFriendRequests((perv) => perv.filter((request) => request.senderId !== senderId))
    router.refresh()
  }

  return (<>
  {friendRequests.length === 0 ? (
    <p className="text-sm text-zinc-500">Тут пусто...</p>
  ) : (
    friendRequests.map((el) => (
      <div key={el.senderId} className="flex gap-4 items-center">
        <UserPlus className="text-black"/>
        <p className="font-medium text-lg">{el.senderEmail}</p>
        <button onClick={() => acceptFriend(el.senderId)} aria-label="Принять заявку в друзья" className="w-8 h-8 bg-indigo-600 hover:bg-indigo-600 grid place-items-center rounded-full transition hover:shadow-medium">
          <Check className="font-semibold text-white w-3/4 h-3/4"/>
        </button>
        <button onClick={() => denyFriend(el.senderId)} aria-label="Отклонить заявку в друзья" className="w-8 h-8 bg-red-600 hover:bg-red-600 grid place-items-center rounded-full transition hover:shadow-medium">
          <X className="font-semibold text-white w-3/4 h-3/4"/>
        </button>
      </div>
    ))
  )}
  </>)
}

export default FriendRequests