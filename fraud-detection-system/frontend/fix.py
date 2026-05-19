import shutil, os

src = r"C:\Users\Administrator\fraud-detection-system\frontend\index.html"
dst = r"C:\Users\Administrator\fraud-detection-system\frontend\index.html"

# Read the new index.html from outputs
# Since we can't access Claude's output directory directly,
# this script fetches it from the running http server output
# Instead - just run the curl command below to overwrite index.html

print("Run this command in Git Bash to overwrite index.html:")
print()
print('curl -o ~/fraud-detection-system/frontend/index.html \\')
print('  "http://localhost:3000/index.html"')
print()
print("Or open http://localhost:3000 in browser,")
print("right-click → Save As → save over the existing index.html")
