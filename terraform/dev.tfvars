environment    = "dev"
component_name = "gp-to-repo"
dns_name       = "gp-to-repo"
repo_name      = "prm-deductions-gp-to-repo"

task_cpu    = 256
task_memory = 512
port        = 3000

service_desired_count = "1"

alb_deregistration_delay = 15

database_name = "gp_to_repo"
