

class ResourceService:
    @staticmethod
    def get_resources(topic, subject='', exam=''):
        resources = []
        
        # Add educational websites
        resources.append({
            'type': 'website',
            'title': f'GeeksforGeeks - {topic}',
            'url': f'https://www.geeksforgeeks.org/search/?q={topic.replace(" ", "%20")}',
            'source': 'GeeksforGeeks'
        })
        
        resources.append({
            'type': 'website',
            'title': f'W3Schools / TutorialsPoint - {topic}',
            'url': f'https://www.tutorialspoint.com/search?q={topic.replace(" ", "%20")}',
            'source': 'TutorialsPoint'
        })
        
        if exam.upper() == 'GATE':
            resources.append({
                'type': 'syllabus',
                'title': 'GATE Official Syllabus & Weightage',
                'url': 'https://gate.iitk.ac.in/',
                'source': 'GATE Official'
            })
            resources.append({
                'type': 'syllabus',
                'title': 'GATE Previous Year Questions & Weightage Analysis',
                'url': 'https://gateoverflow.in/',
                'source': 'GateOverflow'
            })
        elif exam.upper() == 'JEE':
            resources.append({
                'type': 'syllabus',
                'title': 'JEE Main Syllabus & Weightage',
                'url': 'https://jeemain.nta.nic.in/',
                'source': 'NTA Official'
            })
            resources.append({
                'type': 'syllabus',
                'title': 'JEE Advanced Syllabus',
                'url': 'https://jeeadv.ac.in/',
                'source': 'JEE Advanced Official'
            })
        
        return resources
