environment    = "pre-prod"
component_name = "gp-to-repo"
dns_name       = "gp-to-repo"
repo_name      = "prm-deductions-gp-to-repo"

ods_code = "N85027"
asid = "200000001562"

task_cpu    = 256
task_memory = 512
port        = 3000

service_desired_count = "2"

alb_deregistration_delay = 15

log_level = "info"

grant_access_through_vpn = false