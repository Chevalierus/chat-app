"use client"

import { User } from 'lucide-react'
import Link from 'next/link'
import React, { FC, useEffect, useState } from 'react'
import { pusherClient } from '../lib/pusher'
import { toPusherKey } from '../lib/utils'

interface FriendRequsetSidebarOptionProps {
  sessionId: string
  initialUnseenRequests: number
}

const FriendRequsetSidebarOption: FC<FriendRequsetSidebarOptionProps> = ({initialUnseenRequests, sessionId}) => {
  const [unseenRequests, setUnseenRequsests] = useState<number>(initialUnseenRequests)

  useEffect(() => {
    pusherClient.subscribe(toPusherKey(`user:${sessionId}:incoming_friend_requests`))
    pusherClient.subscribe(toPusherKey(`user:${sessionId}:friends`))

    const friendRequestsHandler = () => {
      setUnseenRequsests((prev) => prev + 1)
    }
    const addedFriendRequestHandler = () => {
      setUnseenRequsests((prev) => prev - 1)
    }

    pusherClient.bind('incoming_friend_requests', friendRequestsHandler)
    pusherClient.bind('new_frirnd', addedFriendRequestHandler)

    return () => {
      pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:incoming_friend_requests`))
      pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:friends`))
      pusherClient.unbind('incoming_friend_requests', friendRequestsHandler)
      pusherClient.unbind('new_frirnd', addedFriendRequestHandler)
    }
  }, [sessionId])
  return <Link href="/dashboard/requests" className="text-gray-700 hover:text-indigo-700 hover:background-gray-500 group flex items-center gap-x-3 rounded-md p-2 text-small leading-6 font-semibold">
    <div className="text-gray-400 border-gray-200 group-hover:border-indigo-600 group-hover:indigo-600 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[0.625rem] font-medium bg-white">
      <User className="h-4 w-4"/>
    </div>
    <p className="truncate">Заявки в друзья</p>
    {unseenRequests > 0 ? (
      <div className="rounded-full w-5 h-5 text-xs flex justify-center items-center text-white bg-indigo-600">
        {unseenRequests}
      </div>
    ) : null}
  </Link>
}

export default FriendRequsetSidebarOption