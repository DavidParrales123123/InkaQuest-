path = r'C:\Users\david\Desktop\InkaQuest\frontend\inkaquest-web\src\app\features\guardianes\combate-scene.ts'
raw = open(path, 'rb').read()
try:
    text = raw.decode('utf-8')
    non_ascii = sum(1 for c in text if ord(c) > 127)
    print('UTF-8 OK, non-ascii count', non_ascii)
except UnicodeDecodeError as e:
    print('UTF-8 broken at', e.start)
    text = raw.decode('latin-1')
    replacements = {'Ã¡':'á','Ã©':'é','Ã­':'í','Ã³':'ó','Ãº':'ú','Ã±':'ñ','Â¡':'¡','Â¿':'¿','Â°':'°','Â´':'´','Â¨':'¨','â€”':'—','â€“':'–','â€œ':'"','â€\x9d':'"','â€\x99':"'",'â€™':"'",'â€¦':'...','Ã—':'×','Ã·':'÷','Ã€':'À','Ã‚':'Â','Ã‡':'Ç','Ãˆ':'È','ÃŠ':'Ê','Ã‹':'Ë','ÃŒ':'Ì','ÃŽ':'Î','Ã”':'Õ','Ãœ':'Ü','Ã¢':'â','Ã§':'ç','Ãª':'ê','Ã«':'ë','Ã®':'î','Ã´':'ô','Ã»':'û'}
    for src, dst in replacements.items():
        text = text.replace(src, dst)
    text = ''.join(c if ord(c) < 128 else '?' for c in text)
    print('Converted latin-1 with cleanup')
open(path, 'wb').write(text.encode('utf-8'))
print('saved')
