#!/bin/bash

lf=$(printf "\n")

git ls-files \
	'*.sh' \
	'*.js' '*.ts' \
	'*.md' \
	'*.json' \
| {
	exit_code=0
	while read filename; do
		last_char=$(tail -c 1 $filename)
		if [ "$last_char" != "$lf" ] && [ "$last_char" != "" ]; then
			echo $filename
			exit_code=1
		fi
	done
	exit $exit_code
}

if [ $? -ne 0 ]; then
	echo -e "\033[31mThese files should end with a newline!\033[m"
	exit 1
fi
