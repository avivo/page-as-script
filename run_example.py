from examples.examples_util import *
import os

print os.system("chmod +x examples/web_example.py")
port = 8080
print """Real browser example - go to: 
http://localhost:%i/examples/web_example.py?pageTitle=Examples&showForm=on
""" % port
run_cgi_server('/examples')
