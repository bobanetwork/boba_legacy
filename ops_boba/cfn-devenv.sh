#!/usr/bin/env bash

set -o nounset -o errexit
#set -x
# Global variables
PATH_TO_CFN="$PWD/cloudformation"
PATH_TO_DOCKER="$PWD/docker"
PATH_TO_ENV="$PWD/docker_env"
REGION=us-east-1
REGISTRY_PREFIX=bobanetwork
SERVICE_NAME=
SECRETNAME=
DEPLOYTAG=
FROMTAG=
SUBCMD=
FORCE=no
AWS_ECR="942431445534.dkr.ecr.${REGION}.amazonaws.com"
SKIPSERVICE=
ALL_DOCKER_IMAGES_LIST=`ls ${PATH_TO_CFN}|egrep -v '^0|^datadog|^optimism|^graph|^deployer-rinkeby'|sed 's/.yaml//g'`
DOCKER_IMAGES_LIST=`ls ${PATH_TO_CFN}|egrep -v '^0|^datadog|^optimism|^graph|^replica'|sed 's/.yaml//g'`
ENV_PREFIX=
FORCE=no

# FUNCTIONS

function print_usage_and_exit {
    cat <<EOF
    $(basename $0) - Create and update an EnyaLabs Optimism Integration Environment

    Use this tool to create an EnyaLabs Optimism Integration Environment
    based on a given DeployTag.

    Basic usage is to evoke the script with a sub-command and options for
    that sub-command.

    Global options:

        [--region <region>]             AWS region (us-east-1, eu-west-1, us-west-1, etc) [default: us-east-1]
        -h, --help                      This help :)

    Subcommands:

        create                          create an environment, e.g. provision VPC, ECS Cluster and then deploy the containers
            --deploy-tag <deploy-tag>           The Git Tag or Branch Name of all of the services
            --stack-name <stack-name>                       Stack Name to create

        restart                         does restart of a particular service in a cluster, useful when you've pushed new docker container with the old tag,
                                        as it will be pulled again, also, if you've changed some variable in the aws secrets - it will re-read them again
            --stack-name <stack-name>       the name of the stack, in which you want to restart the service
            --service-name <service-name>   the actual service name

        update                          update an environment, e.g. update the containers to certain deploy-tag
            --deploy-tag <deploy-tag>           The Git Tag or Branch Name of all of the services
            --service-name <service-name>       The name of the service you want to update, if not specified - all services are deployed with the <deploy-tag>
            --stack-name <stack-name>                       Stack Name to create

        deploy                          deploy to an environment, e.g. perform a deployment, for example, you've removed one service OR would like to add new to your dev env
            --deploy-tag <deploy-tag>           The Git Tag or Branch Name of all of the services
            --service-name <service-name>       The name of the service you want to update, if not specified - all services are deployed with the <deploy-tag>
            --stack-name <stack-name>                       Stack Name to create

        destroy                         destroy the deployment of all services
            --service-name <service-name>   Remove the service from the ECS Cluster
            --stack-name <stack-name>                       Stack Name to create

        ssh                              does ssh to the ECS Cluster and then lets you run commands there, writing sudo su will drop you in a root shell
            --stack-name <stack-name>       the name of the stack, in which you want to login to

        envgenerate                     does generate the environment files for each of the services and deployes the file to the S3 Bucket for the environment



    Examples:

        Create/Update an environment
            $(basename $0) create --stack-name <stack-name>  --region <Region> --deploy-tag <DeployTag>

            $(basename $0) update --stack-name <stack-name> --region <Region>  --deploy-tag <DeployTag> --service-name <service-name>

            $(basename $0) update --stack-name <stack-name> --region <Region>  --deploy-tag <DeployTag>

            $(basename $0) deploy --stack-name <stack-name> --region <Region>  --deploy-tag <DeployTag> --service-name <service-name>

            $(basename $0) deploy --stack-name <stack-name> --region <Region>  --deploy-tag <DeployTag>

        Destroy an environment/service
            $(basename $0) destroy --stack-name <stack-name> --service-name <service-name> --region <Region> --deploy-tag <DeployTag> [Note: Remove the service from the ECS Cluster]

            $(basename $0) destroy --stack-name <stack-name> --region <Region> --deploy-tag <DeployTag> [Note: Remove all services from the ECS Cluster]
EOF

    exit 2
}

function timestamp {
    local epoch=${1:-}

    if [[ $epoch == true ]] ; then
        date '+%s'
    else
        date '+%F %H:%M:%S'
    fi
}

function log_output {
    LOG_LEVEL="${1:-INFO}"
    echo -e "[$(timestamp)] $(basename ${0}) ${LOG_LEVEL}: ${@:2}" >&2
}

function error {
    log_output ERROR "${@}"
    exit 1
}

function warn {
    log_output WARNING "${@}"
}

function notice {
    log_output NOTICE "${@}"
}

function info {
    log_output INFO "${@}"
}


function check_dev_environment {
    info "Check for existing VPC and ECS Cluster"
    local CFN_INFRASTRUCTURE_STACK="$(aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE | \
            grep ${ENV_PREFIX}-infrastructure-core | grep StackName | awk -F ":" '{print $2}' | tr -d \",)"
    local CFN_APP_STACK="$(aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE | \
            grep ${ENV_PREFIX}-infrastructure-application | grep StackName | awk -F ":" '{print $2}' | tr -d \",)"
    local CFN_APP_REPLICA_STACK="$(aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE | \
            grep ${ENV_PREFIX}-replica | grep StackName | awk -F ":" '{print $2}' | tr -d \",)"
    local CFN_APP_VERIFIER_STACK="$(aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE | \
          grep ${ENV_PREFIX}-verifier | grep StackName | awk -F ":" '{print $2}' | tr -d \",)"
    if [ -z "$CFN_INFRASTRUCTURE_STACK" ]; then
          warn "VPC does not exist ... creating one"
          cd ${PATH_TO_CFN}
          aws cloudformation create-stack \
              --stack-name ${ENV_PREFIX}-infrastructure-core \
              --capabilities CAPABILITY_IAM \
              --template-body=file://00-infrastructure-core.yaml \
              --region ${REGION} \
              --parameters \
                  ParameterKey=Route53HostedZoneName,ParameterValue=${ENV_PREFIX}.boba.network | jq '.StackId'
          info "Waiting for the ${ENV_PREFIX}-infrastructure-core to create"
          aws cloudformation wait stack-create-complete --stack-name=${ENV_PREFIX}-infrastructure-core
          info "${ENV_PREFIX}-infrastructure-core created .... provisioning ECS Cluster"
          aws cloudformation create-stack \
               --stack-name ${ENV_PREFIX}-infrastructure-application \
               --capabilities CAPABILITY_IAM \
               --template-body=file://03-infrastructure-application.yaml \
               --region ${REGION} \
               --parameters \
                   ParameterKey=InfrastructureStackName,ParameterValue=${ENV_PREFIX}-infrastructure-core \
                   ParameterKey=DomainName,ParameterValue=${ENV_PREFIX}.boba.network | jq '.StackId'
          info "Waiting for the ${ENV_PREFIX}-infrastructure-application to create"
          aws cloudformation wait stack-create-complete --stack-name=${ENV_PREFIX}-infrastructure-application
          info "${ENV_PREFIX}-infrastructure-application created"
          info "Adding Datadog to the ECS Cluster"
          aws cloudformation create-stack \
               --stack-name ${ENV_PREFIX}-datadog \
               --capabilities CAPABILITY_IAM \
               --template-body=file://datadog.yaml \
               --region ${REGION} \
               --parameters \
                   ParameterKey=InfrastructureStackName,ParameterValue=${ENV_PREFIX}-infrastructure-core | jq '.StackId'
            aws cloudformation wait stack-create-complete --stack-name=${ENV_PREFIX}-datadog
            info "Adding Replica ECS Cluster"
            aws cloudformation create-stack \
                 --stack-name ${ENV_PREFIX}-replica \
                 --capabilities CAPABILITY_IAM \
                 --template-body=file://04-infrastructure-replica.yaml \
                 --region ${REGION} \
                 --parameters \
                     ParameterKey=InfrastructureStackName,ParameterValue=${ENV_PREFIX}-infrastructure-core | jq '.StackId'
              aws cloudformation wait stack-create-complete --stack-name=${ENV_PREFIX}-replica
              aws cloudformation create-stack \
                   --stack-name ${ENV_PREFIX}-replica-bkp01 \
                   --capabilities CAPABILITY_IAM \
                   --template-body=file://05-infrastructure-replica-backup01.yaml \
                   --region ${REGION} \
                   --parameters \
                       ParameterKey=InfrastructureStackName,ParameterValue=${ENV_PREFIX}-infrastructure-core | jq '.StackId'
                aws cloudformation wait stack-create-complete --stack-name=${ENV_PREFIX}-replica-bkp01
                aws cloudformation create-stack \
                     --stack-name ${ENV_PREFIX}-replica-bkp02 \
                     --capabilities CAPABILITY_IAM \
                     --template-body=file://06-infrastructure-replica-backup02.yaml \
                     --region ${REGION} \
                     --parameters \
                         ParameterKey=InfrastructureStackName,ParameterValue=${ENV_PREFIX}-infrastructure-core | jq '.StackId'
                  aws cloudformation wait stack-create-complete --stack-name=${ENV_PREFIX}-replica-bkp02
               info "Provioning Redis Cache"
               aws cloudformation create-stack \
                    --stack-name ${ENV_PREFIX}-redis \
                    --capabilities CAPABILITY_IAM \
                    --template-body=file://07-elasticache.yaml \
                    --region ${REGION} \
                    --parameters \
                        ParameterKey=InfrastructureStackName,ParameterValue=${ENV_PREFIX}-infrastructure-core | jq '.StackId'
                 aws cloudformation wait stack-create-complete --stack-name=${ENV_PREFIX}-redis
                 aws cloudformation create-stack \
                      --stack-name ${ENV_PREFIX}-redis-backup \
                      --capabilities CAPABILITY_IAM \
                      --template-body=file://08-elasticache-backup.yaml \
                      --region ${REGION} \
                      --parameters \
                          ParameterKey=InfrastructureStackName,ParameterValue=${ENV_PREFIX}-infrastructure-core | jq '.StackId'
                   aws cloudformation wait stack-create-complete --stack-name=${ENV_PREFIX}-redis-backup
              info "Adding Datadog to the Replica ECS Cluster"
              aws cloudformation create-stack \
                   --stack-name ${ENV_PREFIX}-datadog-replica \
                   --capabilities CAPABILITY_IAM \
                   --template-body=file://datadog-replica.yaml \
                   --region ${REGION} \
                   --parameters \
                       ParameterKey=InfrastructureStackName,ParameterValue=${ENV_PREFIX}-infrastructure-core | jq '.StackId'
                aws cloudformation wait stack-create-complete --stack-name=${ENV_PREFIX}-datadog-replica
              info "Adding Graph to the ECS Cluster"
              aws cloudformation create-stack \
                   --stack-name ${ENV_PREFIX}-graph \
                   --capabilities CAPABILITY_IAM \
                   --template-body=file://05-graph.yaml \
                   --region ${REGION} \
                   --parameters \
                       ParameterKey=InfrastructureStackName,ParameterValue=${ENV_PREFIX}-infrastructure-core | jq '.StackId'
                aws cloudformation wait stack-create-complete --stack-name=${ENV_PREFIX}-graph
          cd ..
      elif [ -z "$CFN_APP_STACK" ]; then
          warn "ECS Cluster does not exist ... creating one"
          cd ${PATH_TO_CFN}
          aws cloudformation create-stack \
               --stack-name ${ENV_PREFIX}-infrastructure-application \
               --capabilities CAPABILITY_IAM \
               --template-body=file://03-infrastructure-application.yaml \
               --region ${REGION} \
               --parameters \
                   ParameterKey=InfrastructureStackName,ParameterValue=${ENV_PREFIX}-infrastructure-core \
                   ParameterKey=DomainName,ParameterValue=${ENV_PREFIX}.boba.network | jq '.StackId'
          aws cloudformation wait stack-create-complete --stack-name=${ENV_PREFIX}-infrastructure-application
          info "Adding Datadog to the ECS Cluster"
          aws cloudformation create-stack \
               --stack-name ${ENV_PREFIX}-datadog \
               --capabilities CAPABILITY_IAM \
               --template-body=file://datadog.yaml \
               --region ${REGION} \
               --parameters \
                   ParameterKey=InfrastructureStackName,ParameterValue=${ENV_PREFIX}-infrastructure-core | jq '.StackId'
            aws cloudformation wait stack-create-complete --stack-name=${ENV_PREFIX}-datadog
            cd ..
     elif [ -z "$CFN_APP_REPLICA_STACK" ]; then
              info "Adding Replica ECS Cluster"
              cd ${PATH_TO_CFN}
              aws cloudformation create-stack \
                   --stack-name ${ENV_PREFIX}-replica \
                   --capabilities CAPABILITY_IAM \
                   --template-body=file://04-infrastructure-replica.yaml \
                   --region ${REGION} \
                   --parameters \
                       ParameterKey=InfrastructureStackName,ParameterValue=${ENV_PREFIX}-infrastructure-core | jq '.StackId'
                aws cloudformation wait stack-create-complete --stack-name=${ENV_PREFIX}-replica
                info "Adding Datadog to the Replica ECS Cluster"
                aws cloudformation create-stack \
                     --stack-name ${ENV_PREFIX}-datadog-replica \
                     --capabilities CAPABILITY_IAM \
                     --template-body=file://datadog-replica.yaml \
                     --region ${REGION} \
                     --parameters \
                         ParameterKey=InfrastructureStackName,ParameterValue=${ENV_PREFIX}-infrastructure-core | jq '.StackId'
                  aws cloudformation wait stack-create-complete --stack-name=${ENV_PREFIX}-datadog-replica
            cd ..
          elif [ -z "$CFN_APP_VERIFIER_STACK" ]; then
                  info "Adding Verifier ECS Cluster"
                  cd ${PATH_TO_CFN}
                  aws cloudformation create-stack \
                       --stack-name ${ENV_PREFIX}-verifier \
                       --capabilities CAPABILITY_IAM \
                       --template-body=file://05-infrastructure-verifier.yaml \
                       --region ${REGION} \
                       --parameters \
                           ParameterKey=InfrastructureStackName,ParameterValue=${ENV_PREFIX}-infrastructure-core | jq '.StackId'
                    aws cloudformation wait stack-create-complete --stack-name=${ENV_PREFIX}-verifier
                    info "Adding IPFS to the ECS Cluster"
                    aws cloudformation create-stack \
                         --stack-name ${ENV_PREFIX}-graph \
                         --capabilities CAPABILITY_NAMED_IAM \
                         --template-body=file://06-ipfs.yaml \
                         --region ${REGION} \
                         --parameters \
                             ParameterKey=InfrastructureStackName,ParameterValue=${ENV_PREFIX}-infrastructure-core | jq '.StackId'
                      aws cloudformation wait stack-create-complete --stack-name=${ENV_PREFIX}-graph
                      info "Adding Graph to the ECS Cluster"
                      aws cloudformation create-stack \
                           --stack-name ${ENV_PREFIX}-graph \
                           --capabilities CAPABILITY_NAMED_IAM \
                           --template-body=file://07-graph.yaml \
                           --region ${REGION} \
                           --parameters \
                               ParameterKey=InfrastructureStackName,ParameterValue=${ENV_PREFIX}-infrastructure-core | jq '.StackId'
                        aws cloudformation wait stack-create-complete --stack-name=${ENV_PREFIX}-graph
            cd ..
          else
            info "ECS Cluster exists"
      fi
}

function deploy_dev_services {
    if [ -z ${SERVICE_NAME} ]; then
      if [[ ${ENV_PREFIX} == *"-replica"* ]];then
        ENV_PREFIX=`echo $ENV_PREFIX|sed 's#-replica##g'`
      elif [[ ${ENV_PREFIX} == *"-verifier"* ]];then
        ENV_PREFIX=`echo $ENV_PREFIX|sed 's#-verifier##g'`
      fi
      notice "Generating environment files ...."
      for srv in $DOCKER_IMAGES_LIST; do
         aws secretsmanager get-secret-value --secret-id ${srv}-${ENV_PREFIX}|jq -r .SecretString|jq -r 'to_entries | .[] | .key + "=" + .value + ""' > ${srv}.env
         aws s3 cp ${srv}.env s3://${ENV_PREFIX}-infrastructure-application-s3/ > /dev/null
         rm -f  ${srv}.env > /dev/null
      done
      notice "Deploying ..."
      for SERVICE in ${ALL_DOCKER_IMAGES_LIST}; do
        cd ${PATH_TO_CFN}
        info "$SERVICE provisioning ..."
        aws cloudformation create-stack \
            --stack-name ${ENV_PREFIX}-$SERVICE \
            --capabilities CAPABILITY_NAMED_IAM \
            --template-body=file://${SERVICE}.yaml \
            --region ${REGION} \
            --parameters \
                ParameterKey=InfrastructureStackName,ParameterValue=${ENV_PREFIX}-infrastructure-core \
                ParameterKey=ImageTag,ParameterValue=${DEPLOYTAG} \
                ParameterKey=EnvironmentName,ParameterValue=${ENV_PREFIX} \
                ParameterKey=DockerPrefix,ParameterValue=${REGISTRY_PREFIX} | jq '.StackId'
        info "$SERVICE provisioning ..."
        cd ..
      done
      for SERVICE in ${ALL_DOCKER_IMAGES_LIST}; do
        aws cloudformation wait stack-create-complete --stack-name=${ENV_PREFIX}-$SERVICE
        info "Provisioned $SERVICE in ${REGION}"
      done
    else
      info "Deploy ${SERVICE_NAME}"
      notice "Generating environment files ...."
      if [[ ${ENV_PREFIX} == *"-replica"* ]];then
        ENV_PREFIX=`echo $ENV_PREFIX|sed 's#-replica##g'`
      elif [[ ${ENV_PREFIX} == *"-verifier"* ]];then
        ENV_PREFIX=`echo $ENV_PREFIX|sed 's#-verifier##g'`
      fi
      aws secretsmanager get-secret-value --secret-id ${SERVICE_NAME}-${ENV_PREFIX}|jq -r .SecretString|jq -r 'to_entries | .[] | .key + "=" + .value + ""' > ${SERVICE_NAME}.env
      aws s3 cp ${SERVICE_NAME}.env s3://${ENV_PREFIX}-infrastructure-application-s3/ > /dev/null
      rm -rf ${SERVICE_NAME}.env
      cd ${PATH_TO_CFN}
      aws cloudformation create-stack \
          --stack-name ${ENV_PREFIX}-${SERVICE_NAME} \
          --capabilities CAPABILITY_NAMED_IAM \
          --template-body=file://${SERVICE_NAME}.yaml \
          --region ${REGION} \
          --parameters \
              ParameterKey=InfrastructureStackName,ParameterValue=${ENV_PREFIX}-infrastructure-core \
              ParameterKey=ImageTag,ParameterValue=${DEPLOYTAG} \
              ParameterKey=EnvironmentName,ParameterValue=${ENV_PREFIX} \
              ParameterKey=DockerPrefix,ParameterValue=${REGISTRY_PREFIX} | jq '.StackId'
      aws cloudformation wait stack-create-complete --stack-name=${ENV_PREFIX}-${SERVICE_NAME}
      info "${SERVICE_NAME} provisioned"
      cd ..
    fi
}

function update_dev_services {
  #set +x
    if [ -z ${SERVICE_NAME} ]; then
      notice "Generating environment files ...."
      for srv in $DOCKER_IMAGES_LIST; do
        if [[ ${ENV_PREFIX} == *"-replica"* ]];then
         ENV_PREFIX=`echo $ENV_PREFIX|sed 's#-replica##g'`
       elif [[ ${ENV_PREFIX} == *"-verifier"* ]];then
         ENV_PREFIX=`echo $ENV_PREFIX|sed 's#-verifier##g'`
       fi
         aws secretsmanager get-secret-value --secret-id ${srv}-${ENV_PREFIX}|jq -r .SecretString|jq -r 'to_entries | .[] | .key + "=" + .value + ""' > ${srv}.env
         aws s3 cp ${srv}.env s3://${ENV_PREFIX}-infrastructure-application-s3/ > /dev/null
         rm -f ${srv}.env > /dev/null
      done
      notice "Updating all services"
      for SERVICE in ${ALL_DOCKER_IMAGES_LIST}; do
        cd ${PATH_TO_CFN}
        info "Updating $SERVICE"
        aws cloudformation update-stack \
            --stack-name ${ENV_PREFIX}-$SERVICE \
            --capabilities CAPABILITY_NAMED_IAM \
            --template-body=file://${SERVICE}.yaml \
            --region ${REGION} \
            --parameters \
                ParameterKey=InfrastructureStackName,ParameterValue=${ENV_PREFIX}-infrastructure-core \
                ParameterKey=ImageTag,ParameterValue=${DEPLOYTAG} \
                ParameterKey=EnvironmentName,ParameterValue=${ENV_PREFIX} \
                ParameterKey=DockerPrefix,ParameterValue=${REGISTRY_PREFIX} | jq '.StackId'
        info "Waiting for update to complete ..."
        aws cloudformation wait stack-update-complete --stack-name=${ENV_PREFIX}-$SERVICE
        info "Update completed"
        cd ..
      done
    else
      notice "Generating environment file for ${SERVICE_NAME}"
      #set -x
      if [[ ${ENV_PREFIX} == *"-replica"* ]];then
        ENV_PREFIX=`echo $ENV_PREFIX|sed 's#-replica##g'`
      elif [[ ${ENV_PREFIX} == *"-verifier"* ]];then
        ENV_PREFIX=`echo $ENV_PREFIX|sed 's#-verifier##g'`
      fi
      aws secretsmanager get-secret-value --secret-id ${SERVICE_NAME}-${ENV_PREFIX}|jq -r .SecretString|jq -r 'to_entries | .[] | .key + "=" + .value + ""' > ${SERVICE_NAME}.env
      aws s3 cp ${SERVICE_NAME}.env s3://${ENV_PREFIX}-infrastructure-application-s3/ > /dev/null
      rm -rf ${SERVICE_NAME}.env
      notice "Update ${SERVICE_NAME} to ${DEPLOYTAG}"
      cd ${PATH_TO_CFN}
      aws cloudformation update-stack \
          --stack-name ${ENV_PREFIX}-${SERVICE_NAME} \
          --capabilities CAPABILITY_NAMED_IAM \
          --template-body=file://${SERVICE_NAME}.yaml \
          --region ${REGION} \
          --parameters \
              ParameterKey=InfrastructureStackName,ParameterValue=${ENV_PREFIX}-infrastructure-core \
              ParameterKey=ImageTag,ParameterValue=${DEPLOYTAG} \
              ParameterKey=EnvironmentName,ParameterValue=${ENV_PREFIX} \
              ParameterKey=DockerPrefix,ParameterValue=${REGISTRY_PREFIX} | jq '.StackId'
      info "Waiting for update to complete"
      aws cloudformation wait stack-update-complete --stack-name=${ENV_PREFIX}-${SERVICE_NAME}
      info "Update completed"
      cd ..
    fi
}

function destroy_dev_services {
      info "Removing ${SERVICE_NAME} from ${ENV_PREFIX}"
      cd ${PATH_TO_CFN}
      aws cloudformation delete-stack \
          --stack-name ${ENV_PREFIX}-${SERVICE_NAME}
      aws cloudformation wait stack-delete-complete --stack-name=${ENV_PREFIX}-${SERVICE_NAME}
      info "Delete completed"
      cd ..
      exit
  }

  function restart_service {
    #set -x
      local force="${1:-}"
      CLUSTERS_LIST=( `aws ecs list-clusters --region ${REGION}|grep ${ENV_PREFIX}|cut -d/ -f2|sed 's#,##g'|sed 's#"##g'` )
      if [[ "${SERVICE_NAME}" == "blockexplorer-blockscout" ]]; then
        SERVICE_NAME="blockscout"
      fi
      for ecs in "${!CLUSTERS_LIST[@]}"; do
        ECS_CLUSTER=`echo ${CLUSTERS_LIST[ecs]}`
        SERVICE4RESTART=`aws ecs list-services --region ${REGION} --cluster $ECS_CLUSTER|grep -i ${ENV_PREFIX}|cut -d/ -f3|sed 's#,##g'|sed 's#"##g'|grep -i ${SERVICE_NAME}|tail -1`
        if [[ -z $SERVICE4RESTART && ${CLUSTERS_LIST[ecs]} = $ECS_CLUSTER ]]; then
          unset 'CLUSTERS_LIST[ecs]'
        else
          CONTAINER_INSTANCE=`aws ecs list-container-instances --region ${REGION} --cluster $ECS_CLUSTER|grep $CLUSTER_NAME|tail -1|cut -d/ -f3|sed 's#"##g'`
          ECS_TASKS=`aws ecs list-tasks --cluster $ECS_CLUSTER --region ${REGION}|grep $CLUSTER_NAME|cut -d/ -f3|sed 's#"##g'|egrep -vi ^datadog|tr '\n' ' '`
          EC2_INSTANCE=`aws ecs describe-container-instances --region ${REGION} --cluster $ECS_CLUSTER --container-instance $CONTAINER_INSTANCE|jq '.containerInstances[0] .ec2InstanceId'|sed 's#"##g'`
          info "Restarting ${SERVICE_NAME} on ${ECS_CLUSTER}"
          aws ecs update-service  --region ${REGION} --service $SERVICE4RESTART --cluster $ECS_CLUSTER --desired-count 0 >> /dev/null
          sleep 30
          if [[ "${SERVICE_NAME}" == "l2geth" || "${SERVICE_NAME}" == "replica-l2" ]] ; then
            aws ssm send-command --document-name "AWS-RunShellScript" --instance-ids $EC2_INSTANCE --parameters commands="rm -rf /mnt/efs/geth_l2/geth/LOCK" --region ${REGION} --output text > /dev/null
            aws ssm send-command --document-name "AWS-RunShellScript" --instance-ids $EC2_INSTANCE --parameters commands="rm -rf /mnt/efs/replica_l2/geth/LOCK" --region ${REGION} --output text > /dev/null
          elif [[ "${SERVICE_NAME}" == "data-transport-layer" || "${SERVICE_NAME}" == "replica-dtl" ]]; then
            aws ssm send-command --document-name "AWS-RunShellScript" --instance-ids $EC2_INSTANCE --parameters commands="rm -rf /mnt/efs/db/LOCK" --region ${REGION} --output text > /dev/null
            aws ssm send-command --document-name "AWS-RunShellScript" --instance-ids $EC2_INSTANCE --parameters commands="rm -rf /mnt/efs/replica-dtl/db/LOCK" --region ${REGION} --output text > /dev/null
          fi
          aws ecs update-service  --region ${REGION} --service $SERVICE4RESTART --cluster $ECS_CLUSTER --desired-count 1 >> /dev/null
          info "Restarted ${SERVICE_NAME} on ${ECS_CLUSTER}"
        fi
      done
    }

    function stop_cluster {
      #set -x
        local force="${1:-}"
        CLUSTERS_LIST=( `aws ecs list-clusters --region ${REGION}|grep ${ENV_PREFIX}|cut -d/ -f2|sed 's#,##g'|sed 's#"##g'` )
        if [[ "${SERVICE_NAME}" == "blockexplorer-blockscout" ]]; then
          SERVICE_NAME="blockscout"
        fi
        for ecs in "${!CLUSTERS_LIST[@]}"; do
          ECS_CLUSTER=`echo ${CLUSTERS_LIST[ecs]}`
          SERVICE4RESTART=`aws ecs list-services --region ${REGION} --cluster $ECS_CLUSTER|grep -i ${ENV_PREFIX}|cut -d/ -f3|sed 's#,##g'|sed 's#"##g'|grep -i ${SERVICE_NAME}|tail -1`
          if [[ -z $SERVICE4RESTART && ${CLUSTERS_LIST[ecs]} = $ECS_CLUSTER ]]; then
            unset 'CLUSTERS_LIST[ecs]'
          else
            CONTAINER_INSTANCE=`aws ecs list-container-instances --region ${REGION} --cluster $ECS_CLUSTER|grep ${ENV_PREFIX}|tail -1|cut -d/ -f3|sed 's#"##g'`
            ECS_TASKS=`aws ecs list-tasks --cluster $ECS_CLUSTER --region ${REGION}|grep ${ENV_PREFIX}|cut -d/ -f3|sed 's#"##g'|egrep -vi ^datadog|tr '\n' ' '`
            EC2_INSTANCE=`aws ecs describe-container-instances --region ${REGION} --cluster $ECS_CLUSTER --container-instance $CONTAINER_INSTANCE|jq '.containerInstances[0] .ec2InstanceId'|sed 's#"##g'`
            SERVICE4RESTART=`aws ecs list-services --region ${REGION} --cluster $ECS_CLUSTER|grep -i ${ENV_PREFIX}|cut -d/ -f3|sed 's#,##g'|egrep -vi ^datadog|tr '\n' ' '|sed 's#"##g'`
              if [[ "${SERVICE_NAME}" == "data-transport-layer" || "${SERVICE_NAME}" == "replica-dtl" || "${SERVICE_NAME}" == "verifier-dtl" || "${SERVICE_NAME}" == "replica-dtl-bkp01" || "${SERVICE_NAME}" == "replica-dtl-bkp02"  ]]; then
                TASK_ARN=`aws ecs list-tasks --cluster $ECS_CLUSTER --service ${SERVICE_NAME} --output text --query taskArns[0]`
                if [[ $TASK_ARN == "None" ]]; then
                  continue
                else
                  aws ecs update-service  --region ${REGION} --service ${SERVICE_NAME} --cluster $ECS_CLUSTER --desired-count 0 >> /dev/null
                  aws ecs stop-task --cluster $ECS_CLUSTER --task $TASK_ARN >> /dev/null
                  aws ssm send-command --document-name "AWS-RunShellScript" --instance-ids $EC2_INSTANCE --parameters commands="rm -rf /mnt/efs/db/LOCK" --region ${REGION} --output text >> /dev/null
                  aws ssm send-command --document-name "AWS-RunShellScript" --instance-ids $EC2_INSTANCE --parameters commands="rm -rf /mnt/efs/replica-dtl/db/LOCK" --region ${REGION} --output text >> /dev/null
                  aws ssm send-command --document-name "AWS-RunShellScript" --instance-ids $EC2_INSTANCE --parameters commands="rm -rf /mnt/efs/verifier-dtl/db/LOCK" --region ${REGION} --output text >> /dev/null
                fi
              elif [[ "${SERVICE_NAME}" == "l2geth" || "${SERVICE_NAME}" == "replica-l2" || "${SERVICE_NAME}" == "verifier-l2" || "${SERVICE_NAME}" == "replica-l2-bkp01" || "${SERVICE_NAME}" == "replica-l2-bkp02" ]]; then
                TASK_ARN=`aws ecs list-tasks --cluster $ECS_CLUSTER --service ${SERVICE_NAME} --output text --query taskArns[0]`
                if [[ $TASK_ARN == "None" ]]; then
                  continue
                else
                  aws ecs update-service  --region ${REGION} --service ${SERVICE_NAME} --cluster $ECS_CLUSTER --desired-count 0 >> /dev/null
                  aws ecs stop-task --cluster $ECS_CLUSTER --task $TASK_ARN >> /dev/null
                  aws ssm send-command --document-name "AWS-RunShellScript" --instance-ids $EC2_INSTANCE --parameters commands="rm -rf /mnt/efs/geth_l2/geth/LOCK" --region ${REGION} --output text >> /dev/null
                  aws ssm send-command --document-name "AWS-RunShellScript" --instance-ids $EC2_INSTANCE --parameters commands="rm -rf /mnt/efs/replica-l2/geth/LOCK" --region ${REGION} --output text >> /dev/null
                  aws ssm send-command --document-name "AWS-RunShellScript" --instance-ids $EC2_INSTANCE --parameters commands="rm -rf /mnt/efs/verifier-l2/geth/LOCK" --region ${REGION} --output text >> /dev/null
                fi
              else
                aws ecs update-service  --region ${REGION} --service ${SERVICE_NAME} --cluster $ECS_CLUSTER --desired-count 0 >> /dev/null
              fi
          info "STOPPED ${SERVICE_NAME} on ${ECS_CLUSTER}"
          fi
        done
      }


    function ssh_to_ecs_cluster {
#set -x
        CLUSTER_NAME=$(echo ${ENV_PREFIX}|sed 's#-replica.*##; s#-verifier.*##; s#-gnosis.*##')
        #CLUSTER_NAME=$(echo ${ENV_PREFIX})
        if [[ ${ENV_PREFIX} == "$CLUSTER_NAME-replica" && ${ENV_PREFIX} != "$CLUSTER_NAME-replica-bkp01"  && ${ENV_PREFIX} != "$CLUSTER_NAME-replica-bkp02" ]];then
          ECS_CLUSTER=`aws ecs list-clusters  --region ${REGION}|grep -w $CLUSTER_NAME-replica|head -1|cut -d/ -f2|sed 's#,##g'|sed 's#"##g'`
        elif [[ ${ENV_PREFIX} == "$CLUSTER_NAME-verifier" ]];then
          ECS_CLUSTER=`aws ecs list-clusters  --region ${REGION}|grep -w $CLUSTER_NAME-verifier|tail -1|cut -d/ -f2|sed 's#,##g'|sed 's#"##g'`
        elif [[ ${ENV_PREFIX} == "$CLUSTER_NAME-gnosis" ]];then
          ECS_CLUSTER=`aws ecs list-clusters  --region ${REGION}|grep -w $CLUSTER_NAME-gnosis|tail -1|cut -d/ -f2|sed 's#,##g'|sed 's#"##g'`
        elif [[ ${ENV_PREFIX} == "$CLUSTER_NAME-replica-bkp01" ]];then
          ECS_CLUSTER=`aws ecs list-clusters  --region ${REGION}|grep $CLUSTER_NAME-replica-bkp01|tail -1|cut -d/ -f2|sed 's#,##g'|sed 's#"##g'`
        elif [[ ${ENV_PREFIX} == "$CLUSTER_NAME-replica-bkp02" ]];then
          ECS_CLUSTER=`aws ecs list-clusters  --region ${REGION}|grep $CLUSTER_NAME-replica-bkp02|tail -1|cut -d/ -f2|sed 's#,##g'|sed 's#"##g'`
        elif [[ ${ENV_PREFIX} != "$CLUSTER_NAME-replica" && ${ENV_PREFIX} != "$CLUSTER_NAME-replica-bkp01" && ${ENV_PREFIX} != "$CLUSTER_NAME-replica-bkp02" ]]; then
          ECS_CLUSTER=`aws ecs list-clusters  --region ${REGION}|grep $ENV_PREFIX|egrep -v 'replica|verifier|gnosis'|tail -1|cut -d/ -f2|sed 's#,##g'|sed 's#"##g'`
        fi
        CONTAINER_INSTANCE=`aws ecs list-container-instances --region ${REGION} --cluster $ECS_CLUSTER|grep $CLUSTER_NAME|tail -1|cut -d/ -f3|sed 's#"##g'`
        EC2_INSTANCE=`aws ecs describe-container-instances --region ${REGION} --cluster $ECS_CLUSTER --container-instance $CONTAINER_INSTANCE|jq '.containerInstances[0] .ec2InstanceId'|sed 's#"##g'`
        info "SSH to server $EC2_INSTANCE"
        aws ssm start-session --target $EC2_INSTANCE
      }

      function list_clusters {
          #set -x
          CLUSTERS_LIST_PREFIX=( `aws ecs list-clusters --region us-east-1|grep us-east-1|cut -d/ -f2|sed 's#,##g'|sed 's#"##g'|egrep -v default|cut -d'-' -f1|sort -u` )
          for ecs in "${!CLUSTERS_LIST_PREFIX[@]}"; do
            ECS_CLUSTER_SHORT=`echo ${CLUSTERS_LIST_PREFIX[ecs]}`
            ECS_CLUSTER="CLUSTER: `echo ${CLUSTERS_LIST_PREFIX[ecs]}` \n"
              URL="L2-URL: https://`aws cloudformation list-exports --query \"Exports[?Name==\\\`${ECS_CLUSTER_SHORT}-infrastructure-core:DomainName\\\`].Value\"  --output text` \n"
            ELB_INT="DTL-URL: http://`aws cloudformation list-exports --query \"Exports[?Name==\\\`${ECS_CLUSTER_SHORT}-infrastructure-core:LoadBalancerInt:DNSName\\\`].Value\"  --output text`:8081 \n"
            ELB_L2="L2-ELB-INTERNAL: https://`aws cloudformation list-exports --query \"Exports[?Name==\\\`${ECS_CLUSTER_SHORT}-infrastructure-core:LoadBalancer:DNSName\\\`].Value\"  --output text` \n"
            ELB_BLOCKSCOUT="BLOCKSCOUT: https://`aws cloudformation list-exports --query \"Exports[?Name==\\\`${ECS_CLUSTER_SHORT}-infrastructure-core:LoadBalancerBlockscout:DNSName\\\`].Value\"  --output text` \n"
            ELB_GRAPH="GRAPH: https://`aws cloudformation list-exports --query \"Exports[?Name==\\\`${ECS_CLUSTER_SHORT}-infrastructure-core:LoadBalancerGraph:DNSName\\\`].Value\"  --output text` \n"
            ELB_IPFS="IPFS: http://`aws cloudformation list-exports --query \"Exports[?Name==\\\`${ECS_CLUSTER_SHORT}-infrastructure-core:LoadBalancerIPFS:DNSName\\\`].Value\"  --output text` \n"
            ELB_PROXYD01="PROXYD-01: https://`aws cloudformation list-exports --query \"Exports[?Name==\\\`${ECS_CLUSTER_SHORT}-infrastructure-core:LoadBalancerProxyd:DNSName\\\`].Value\"  --output text` \n"
            ELB_PROXYD02="PROXYD-02: https://`aws cloudformation list-exports --query \"Exports[?Name==\\\`${ECS_CLUSTER_SHORT}-infrastructure-core:LoadBalancerProxydBackup:DNSName\\\`].Value\"  --output text` \n"
            ELB_REPLICA_L2="REPLICA-L2-URL: http://`aws cloudformation list-exports --query \"Exports[?Name==\\\`${ECS_CLUSTER_SHORT}-infrastructure-core:LoadBalancerReplica:DNSName\\\`].Value\"  --output text`:8545 \n"
            ELB_REPLICA2_L2="REPLICA-BKP01-L2-URL: https://`aws cloudformation list-exports --query \"Exports[?Name==\\\`${ECS_CLUSTER_SHORT}-infrastructure-core:LoadBalancerReplica2:DNSName\\\`].Value\"  --output text` \n"
            ELB_REPLICA3_L2="REPLICA-BKP02-L2-URL: https://`aws cloudformation list-exports --query \"Exports[?Name==\\\`${ECS_CLUSTER_SHORT}-infrastructure-core:LoadBalancerReplica3:DNSName\\\`].Value\"  --output text` \n"
            ELB_REPLICA_DTL="REPLICA-DTL: http://`aws cloudformation list-exports --query \"Exports[?Name==\\\`${ECS_CLUSTER_SHORT}-infrastructure-core:LoadBalancerReplicaDTL:DNSName\\\`].Value\"  --output text`:7878 \n"
            ELB_REPLICA_DTL2="REPLICA-BKP01-DTL: http://`aws cloudformation list-exports --query \"Exports[?Name==\\\`${ECS_CLUSTER_SHORT}-infrastructure-core:LoadBalancerReplicaDTL2:DNSName\\\`].Value\"  --output text`:7878 \n"
            ELB_REPLICA_DTL3="REPLICA-BKP02-DTL: http://`aws cloudformation list-exports --query \"Exports[?Name==\\\`${ECS_CLUSTER_SHORT}-infrastructure-core:LoadBalancerReplicaDTL3:DNSName\\\`].Value\"  --output text`:7878 \n"
            REPLICA_NAME="REPLICA-NAME: `aws cloudformation list-exports --query \"Exports[?Name==\\\`${ECS_CLUSTER_SHORT}-infrastructure-core:EcsClusterReplica\\\`].ExportingStackId\"  --output text|cut -d/ -f2` \n"
            REPLICA_BKP01_NAME="REPLICA-BKP01-NAME: `aws cloudformation list-exports --query \"Exports[?Name==\\\`${ECS_CLUSTER_SHORT}-infrastructure-core:EcsClusterReplicaBackup01\\\`].ExportingStackId\"  --output text|cut -d/ -f2` \n"
            REPLICA_BKP02_NAME="REPLICA-BKP02-NAME: `aws cloudformation list-exports --query \"Exports[?Name==\\\`${ECS_CLUSTER_SHORT}-infrastructure-core:EcsClusterReplicaBackup02\\\`].ExportingStackId\"  --output text|cut -d/ -f2` \n"
            VERIFIER_NAME="VERIFIER-NAME: `aws cloudformation list-exports --query \"Exports[?Name==\\\`${ECS_CLUSTER_SHORT}-infrastructure-core:EcsClusterVerifier\\\`].ExportingStackId\"  --output text|cut -d/ -f2` \n"
            echo -e " --------------- \n $ECS_CLUSTER $ELB_INT $ELB_L2 $ELB_REPLICA_L2 $ELB_REPLICA_DTL $URL $ELB_PROXYD01 $ELB_PROXYD02 $ECS_CLUSTER $REPLICA_NAME $REPLICA_BKP01_NAME $REPLICA_BKP02_NAME $VERIFIER_NAME $ELB_BLOCKSCOUT $ELB_IPFS $ELB_REPLICA2_L2"
          done
        }


     function generate_environment {
       #set -x
       CLUSTER_NAME=$(echo ${ENV_PREFIX}|sed 's#-replica##; s#-verifier##')
        if [ -z ${SERVICE_NAME} ]; then
           info "Missing SERVICE_NAME going to re-generate all environment files"
           for srv in $ALL_DOCKER_IMAGES_LIST datadog; do
              aws secretsmanager get-secret-value --secret-id ${srv}-${CLUSTER_NAME}|jq -r .SecretString|jq -r 'to_entries | .[] | .key + "=" + .value + ""' > ${srv}.env
              aws s3 cp ${srv}.env s3://${CLUSTER_NAME}-infrastructure-application-s3/ > /dev/null
              rm -f ${srv}.env > /dev/null
            done
        else
            info "Generating environment file for ${SERVICE_NAME}"
            aws secretsmanager get-secret-value --secret-id ${SERVICE_NAME}-${CLUSTER_NAME}|jq -r .SecretString|jq -r 'to_entries | .[] | .key + "=" + .value + ""' > ${SERVICE_NAME}.env
            aws s3 cp ${SERVICE_NAME}.env s3://${CLUSTER_NAME}-infrastructure-application-s3/ > /dev/null
            rm -f ${SERVICE_NAME}.env > /dev/null
        fi
      }


if [[ $# -gt 0 ]]; then
    while [[ $# -gt 0 ]]; do
        case "${1}" in
            -h|--help)
                print_usage_and_exit
                ;;
            create|deploy|update|destroy|restoredb|restart|ssh|list-clusters|envgenerate|stop)
                SUBCMD="${1}"
                shift
                ;;
            --region)
                REGION="${2}"
                shift 2
                ;;
            --service-name)
                SERVICE_NAME="${2}"
                shift 2
                ;;
            --skip-service)
                SKIPSERVICE="${2}"
                shift 2
                ;;
            --deploy-tag)
                DEPLOYTAG="${2}"
                shift 2
                ;;
            --from-tag)
                FROMTAG="${2}"
                shift 2
                ;;
            --registry-prefix)
                REGISTRY_PREFIX="${2}"
                shift 2
                ;;
            --stack-name)
                ENV_PREFIX="${2}"
                shift 2
                ;;
            --force|-f)
                FORCE="${2}"
                shift 1
                ;;
            --*)
                error "Unknown option ${1}"
                ;;
            *)
                error "Unknown sub-command ${1}"
                ;;
        esac
    done
else
    print_usage_and_exit
fi

case "${SUBCMD}" in
    create)
        [[ -z "${ENV_PREFIX}" ]] && error 'Missing required option --stack-name'
        check_dev_environment
        ;;
    deploy)
        [[ -z "${DEPLOYTAG}" ]] && error 'Missing required option --deploy-tag'
        [[ -z "${ENV_PREFIX}" ]] && error 'Missing required option --stack-name'
        deploy_dev_services
        ;;
    update)
        [[ -z "${DEPLOYTAG}" ]] && error 'Missing required option --deploy-tag'
        [[ -z "${ENV_PREFIX}" ]] && error 'Missing required option --stack-name'
        [[ -z "${SERVICE_NAME}" ]] && error 'Missing required option --service-name'
        stop_cluster
        update_dev_services
        ;;
    restart)
        [[ -z "${ENV_PREFIX}" ]] && error 'Missing required option --stack-name'
        [[ -z "${SERVICE_NAME}" ]] && error 'Missing required option --service-name'
        [[ -z "${FORCE}" ]] && warn 'Missing --force, so not going to delete the /mnt/efs directory contents'
        generate_environment
        restart_service
        ;;
    stop)
        [[ -z "${ENV_PREFIX}" ]] && error 'Missing required option --stack-name'
        [[ -z "${FORCE}" ]] && warn 'Missing --force, so not going to delete the /mnt/efs directory contents'
        [[ -z "${SERVICE_NAME}" ]] && error 'Missing required option --service-name'
        stop_cluster
        ;;
    ssh)
        [[ -z "${ENV_PREFIX}" ]] && error 'Missing required option --stack-name'
        ssh_to_ecs_cluster
        ;;
    list-clusters)
        list_clusters
        ;;
    envgenerate)
        [[ -z "${ENV_PREFIX}" ]] && error 'Missing required option --stack-name'
        generate_environment
        ;;
    destroy)
        destroy_dev_services $FORCE
        ;;
    *)
        error "Missing required subcommand. "
esac

# Default to us-east-1 region
if [[ -z "${REGION}" ]] ; then
    warn "Missing option --region, defaulting to ${REGION}"
fi

if [[ -z "${REGISTRY_PREFIX}" ]] ; then
    warn "Missing option --registry-prefix, defaulting to ${REGISTRY_PREFIX}"
fi
