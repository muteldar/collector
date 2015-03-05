Vagrant.configure(2) do |config|
  	config.vm.box = "ubuntu/trusty64"
  	config.vm.network "forwarded_port", guest: 80, host: 8000
    config.vm.synced_folder "Web/", "/var/www"
  	config.vm.provision "shell", path: "Server/config.sh"
end
