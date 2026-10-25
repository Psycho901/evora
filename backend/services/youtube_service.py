import os
import random
from googleapiclient.discovery import build

class YouTubeService:
    def __init__(self):
        self.api_key = os.getenv('YOUTUBE_API_KEY')
        self.youtube = None
        if self.api_key and self.api_key != 'your_youtube_api_key_here':
            try:
                self.youtube = build('youtube', 'v3', developerKey=self.api_key)
            except:
                self.youtube = None
    
    def search_videos(self, query, max_results=5):
        if not self.youtube:
            # Mock mode for demo
            mock_videos = [
                {
                    'id': 'mock1',
                    'title': f'{query} - Lecture 1 | Explained Simply',
                    'thumbnail': 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
                    'channel': 'EVORA Demo',
                    'url': f'https://www.youtube.com/results?search_query={query.replace(" ", "+")}'
                },
                {
                    'id': 'mock2',
                    'title': f'{query} - Concept Explained with Examples',
                    'thumbnail': 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
                    'channel': 'Study Channel',
                    'url': f'https://www.youtube.com/results?search_query={query.replace(" ", "+")}'
                },
                {
                    'id': 'mock3',
                    'title': f'{query} - Quick Revision',
                    'thumbnail': 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
                    'channel': 'Exam Prep',
                    'url': f'https://www.youtube.com/results?search_query={query.replace(" ", "+")}'
                }
            ]
            return mock_videos[:max_results]
        
        try:
            request = self.youtube.search().list(
                q=query,
                part='snippet',
                type='video',
                maxResults=max_results,
                relevanceLanguage='en'
            )
            response = request.execute()
            videos = []
            for item in response['items']:
                videos.append({
                    'id': item['id']['videoId'],
                    'title': item['snippet']['title'],
                    'thumbnail': item['snippet']['thumbnails']['medium']['url'],
                    'channel': item['snippet']['channelTitle'],
                    'url': f"https://www.youtube.com/watch?v={item['id']['videoId']}"
                })
            return videos
        except Exception as e:
            print(f"YouTube error: {e}")
            return []
