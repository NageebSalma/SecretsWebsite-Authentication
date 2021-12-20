# SecretsWebsite-Authentication
This is a website where people post secrets anonymously .. I here experiment with six levels of user authentication
level 1 : Just simple check if email is previously registered, ceck if password matches
level 2 : If email is previously registered, check password inserted with the DECRYPTION of the password from the DB.
level 3 : If email is previously registered, check the hash of inserted password with the hash of registered with passwprd. (md5 npm package).
level 4 : If email is previously registered, check to see if the hashOf(inserted password concatenated with the stored salt of user) is equal to the stored hash.
level 5 : Using cookies and sessions.
level 6 : Using AuthO. 
 
