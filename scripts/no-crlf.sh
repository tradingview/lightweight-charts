#!/bin/bash

git grep -Il "$(printf "\r\n")" :^*.bat

if [ $? -eq 0 ]
then
	echo -e "\033[31mThese files has CRLF line endings!\033[m"
	exit 1
fi
