#export SPEECH_KEY=<your azure SPEECH_KEY>
#export SPEECH_REGION=<your azure SPEECH_REGION,e.g eastasia>
export PATH=/data/tgz/node-v22.1.0-linux-x64-glibc-217/bin:$PATH
export NVM_NODEJS_ORG_MIRROR=/data/tgz/node-v22.1.0-linux-x64-glibc-217
nvm use system
npm run dev -- --host 0.0.0.0
