

nb_images = 3539;

names = {};
for i = 0:nb_images,
    if i <10
        names{i+1} = ['SID1491/cubic/SID1491_000',num2str(i),'.jpg'];
    elseif i<100
        names{i+1} = ['SID1491/cubic/SID1491_00',num2str(i),'.jpg'];
    elseif i<1000
        names{i+1} = ['SID1491/cubic/SID1491_0',num2str(i),'.jpg'];
    else
        names{i+1} = ['SID1491/cubic/SID1491_',num2str(i),'.jpg'];
    end
end
imds = imageDatastore(names);

%%
figure
for i = 1:nb_images+1,
    img = readimage(imds,i);
    imshow([255 - img])
    pause(0.01)
    clf
end