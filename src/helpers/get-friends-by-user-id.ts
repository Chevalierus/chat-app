import { fetchRedis } from "./redis"

export const getFriendsByUserId = async (userId: string) => {
  //полученеие друзей для текущего пользователя
  const friendIds = await fetchRedis('smembers', `user:${userId}:friends`) as string[]
  const friends = await Promise.all(
    friendIds.map(async (friendId) => {
      const friend = await fetchRedis('get', `user:${friendId}`) as string
      const parsedFriends = JSON.parse(friend)
      return parsedFriends
    })
  )
  return friends
}