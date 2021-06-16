environment    = "dev"
component_name = "gp-to-repo"
dns_name       = "gp-to-repo"
repo_name      = "prm-deductions-gp-to-repo"

ods_code = "A91368"
asid = "918999199177"

task_cpu    = 256
task_memory = 512
port        = 3000

service_desired_count = "1"

alb_deregistration_delay = 15

database_name = "gp_to_repo"

deductions_private_database_subnets  = ["subnet-0a1ea7fccf76a709e", "subnet-0a54899ccf6b62a0c"]
