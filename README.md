# Lorrgs

simple webapp to analyze and compare cooldown usage in top logs by spec/comp.

## Link

👉 [lorrgs.io](https://lorrgs.io/).


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)



# Dev

## first time setup
```sh
# 1) install nodejs (v16.19)
# https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-20-04
cd ~
curl -sL https://deb.nodesource.com/setup_16.x -o /tmp/nodesource_setup.sh
sudo bash /tmp/nodesource_setup.sh
sudo apt install nodejs

# 2) install dependencies
npm install
```

```sh
npm run server
```


## local AdSense testing:

Ads are only shown if we serve the website is served from the correct domain.
To allow local testing we can setup the following:

1) on windows
    edit: `C:\Windows\System32\drivers\etc\hosts` and add the following:
    ```sh
    # fake lorrgs domain to do ad sense testing
    ::1 local.lorrgs.io
    ```

2) open the `webpack.config.js` file and add:
    ```js
    devServer: {
        allowedHosts: "all",
    }
    ```

3) browse the website via http://local.lorrgs.io:9001

