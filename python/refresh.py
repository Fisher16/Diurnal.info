from random import randint

listFile=open("/home/fisher/live/backup/diurnal/python/list","r")
  
dirArr=[]
for line in listFile:
    dirArr.append(line.replace("\n",""))
listFile.close()




requestFile=open("/home/fisher/live/backup/diurnal/request","w")
requestFile.write(dirArr[randint(0,len(dirArr)-1)])
requestFile.close()
