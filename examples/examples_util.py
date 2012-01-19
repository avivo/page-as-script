# Lets you import from the parent directory even if its not already in the python path
def add_parent_dir_to_python_path():
  import sys, os
  up_dir_path = os.path.join(os.path.join(*os.path.split(os.path.abspath(__file__))[:-1]), '..')
  sys.path.append(up_dir_path)

add_parent_dir_to_python_path()

# Run for better cgi debug messages
def cgi_setup():
  import cgi
  import cgitb
  cgitb.enable() # the toggle to turn this on

# Hack to output state in the core code using the cgi example; use this pattern:
# "from examples_util import debug; debug(string_or_var_to_print)"
# (not imported by default so that the debug statement is self contained)
debug_string = ''
def debug(obj): 
  global debug_string
  debug_string += '\n' + str(obj)
def debug_html():
  if debug_string:
    return '<div style="padding:20px;"><pre style="background-color:pink">Debug output:' + \
           debug_string + '</pre></div>'
  else: return ''

# Super simple python templating
def template(file, template_dict): 
  return open(file, 'r').read() % template_dict
def html_template(file, template_dict): 
  return 'Content-Type: text/html\n\n' + template(file, template_dict)

# Creates and runs an http server that can serve cgi scripts
def run_cgi_server(dir, port = 8080):
  print "*Warning* - this allows anyone that can reach your ip to access your computer."
  print "(so do not run this while connected to a public network without a firewall)"
  from BaseHTTPServer import HTTPServer
  from CGIHTTPServer import CGIHTTPRequestHandler
  CGIHTTPRequestHandler.cgi_directories.append(dir)
  serveradresse = ("", 8080)
  server = HTTPServer(serveradresse, CGIHTTPRequestHandler)
  server.serve_forever()
