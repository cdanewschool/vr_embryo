#!/usr/local/bin/zsh

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

autoload zmv

curr=$(pwd)

for dataset in assets/datasets/*/; do
    echo "looking in "$dataset"..."
    for channel in $dataset*/; do
        echo "${CYAN}channel: ${GREEN}$channel${NC}"
        cd $channel
        for file in $channel; do
            if [[ $1 = "dry" ]]; then
                zmv -Qf -n 't_(<->)_z_(<->).png(n)' 't_$(($1-1))_z_$(($2-1)).png'
            elif [[ $1 = "go" ]]; then
                echo "${CYAN}really rename everything in ${GREEN}$channel?${NC} y/n"
                read confirm
                if [[ $confirm = "y" ]]; then
                    echo "${CYAN}doin it${NC}"
                    zmv -Qf 't_(<->)_z_(<->).png(n)' 't_$(($1-1))_z_$(($2-1)).png'
                elif [[ $confirm = "n" ]]; then
                    echo "${CYAN}great, skipping this channel...${NC}"
                fi
            else
                echo '${CYAN}specify ${NC}"dry"${CYAN} or ${NC}"go"'
            fi
        done
        cd $curr
    done
done
