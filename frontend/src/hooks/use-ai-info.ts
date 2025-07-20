import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { aiInfoAPI } from '@/lib/api'
import type { AIInfoItem, AIInfoCreate } from '@/types'

function useAIInfo(date: string) {
  return useQuery({
    queryKey: ['ai-info', date],
    queryFn: async () => {
      const response = await aiInfoAPI.getByDate(date)
      return response.data as AIInfoItem[]
    },
    enabled: !!date,
  })
}

export default useAIInfo

export function useAddAIInfo() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: AIInfoCreate) => {
      const response = await aiInfoAPI.add(data)
      return response.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-info', variables.date] })
      queryClient.invalidateQueries({ queryKey: ['ai-info-dates'] })
    },
  })
}

export function useDeleteAIInfo() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (date: string) => {
      const response = await aiInfoAPI.delete(date)
      return response.data
    },
    onSuccess: (data, date) => {
      queryClient.invalidateQueries({ queryKey: ['ai-info', date] })
      queryClient.invalidateQueries({ queryKey: ['ai-info-dates'] })
    },
  })
}

export function useAIInfoDates() {
  return useQuery({
    queryKey: ['ai-info-dates'],
    queryFn: async () => {
      const response = await aiInfoAPI.getAllDates()
      return response.data as string[]
    },
  })
}

export function useFetchAINews() {
  return useQuery({
    queryKey: ['ai-news'],
    queryFn: async () => {
      const response = await aiInfoAPI.fetchNews()
      return response.data.news
    },
    staleTime: 5 * 60 * 1000, // 5분
  })
} 
