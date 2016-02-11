#!/bin/bash

filename=${1}
date=`date +%Y-%m-%d`
while read LINE
do
    if [ -e "${LINE}-${date}.cbz" ] 
    then 
	#first check if the cbz exists, if it does update it, otherwise create new
	echo "Updating ${LINE}.cbz"
	zip -u "${LINE}-${date}.cbz" "${LINE}"*.jpg "${LINE}"*.png
    else
	echo "Creating ${LINE}.cbz"
	#    zip ${LINE}-${date}.cbz ${LINE}*.jpg ${LINE}*.png
	zip "${LINE}-${date}.cbz" "${LINE}"*.jpg "${LINE}"*.png
    fi
    #remove source files if zip is successful
    if [[ $? == 0 ]]
    then 
	#mv ${LINE}.zip ${LINE}.cbz
	rm "${LINE}"*.jpg "${LINE}"*.png
    fi
    
done < $filename

